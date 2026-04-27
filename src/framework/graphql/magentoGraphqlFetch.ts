import config from "@/src/config/config";
import { normalizeStoreViewCode } from "@/src/config/storeViews";
import { getGraphqlEndpoint } from "@/src/framework/graphql/getGraphqlEndpoint";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";

/**
 * Options on every Magento GraphQL call (server side).
 *
 * Multi-store / multi-language note:
 *  - `storeViewCode` is sent as the Magento `Store` header. Every `Store` value is a
 *    separate cache key so translations never bleed between languages.
 *  - `cacheTtlMs` turns on an in-process response cache (per Store header + query + variables).
 *    Use it for data that rarely changes per request (storeConfig, category tree, CMS blocks).
 *  - `timeoutMs` caps how long we wait for Magento; on slow backends this protects the
 *    RSC render from hanging and holding a connection slot.
 */
type GraphqlFetchOptions = {
  /**
   * When set (known store view code), sent as the GraphQL `Store` header so PLP/PDP match the
   * same store as `layout` without re-reading cookies mid-render. Unknown codes fall back to
   * {@link getServerStoreViewCode}.
   */
  storeViewCode?: string;
  /**
   * `"none"` (default): request is sent as guest — no `Authorization` header.
   * `"apiKey"`: send `Authorization: Bearer ${config.commerce.apiKey}`. Use only for endpoints
   * that actually need it; catalog queries (PLP, PDP, CMS, storeConfig) should stay `"none"` so
   * Magento does not scope the result set to a customer / integration.
   */
  auth?: "none" | "apiKey";
  /**
   * When > 0, successful responses are cached in-memory for this many ms, keyed by
   * `{endpoint, Store header, query, variables}`. Zero / unset = no cache (live call).
   * Multi-store safe: every store view code has its own cache slot.
   */
  cacheTtlMs?: number;
  /** Hard timeout (ms) for the underlying `fetch`. Defaults to {@link DEFAULT_REQUEST_TIMEOUT_MS}. */
  timeoutMs?: number;
  /**
   * When `true`, a stale cache entry (even past `cacheTtlMs`) can be served if Magento fails
   * with a transient error (PHP fatal / 5xx). This absorbs backend blips without a visible error.
   */
  serveStaleOnError?: boolean;
};

type GraphqlPayload<TData> = {
  data?: TData;
  errors?: ReadonlyArray<{ message?: string }>;
};

export class MagentoGraphqlError extends Error {
  constructor(
    message: string,
    public readonly graphqlErrors?: ReadonlyArray<{ message?: string }>,
    public readonly httpStatus?: number,
    /**
     * True when Magento returned a PHP `Fatal error` (commonly `Allowed memory size ... exhausted`)
     * instead of a GraphQL JSON payload. Callers use this to back off or fall back to defaults.
     */
    public readonly isPhpFatal: boolean = false,
  ) {
    super(message);
    this.name = "MagentoGraphqlError";
  }
}

// ── Tunables ────────────────────────────────────────────────

/** Read from env so ops can tighten load per deploy without code changes. */
function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Cap total concurrent server-to-Magento POSTs. Tune with `MAGENTO_GRAPHQL_MAX_CONCURRENCY`. */
const MAX_CONCURRENT_REQUESTS = envInt("MAGENTO_GRAPHQL_MAX_CONCURRENCY", 6);
/** Per-request timeout. Tune with `MAGENTO_GRAPHQL_TIMEOUT_MS`. */
const DEFAULT_REQUEST_TIMEOUT_MS = envInt("MAGENTO_GRAPHQL_TIMEOUT_MS", 15_000);
/** Upper bound on cached entries across all store views. Evicted oldest-first. */
const RESPONSE_CACHE_MAX_ENTRIES = envInt(
  "MAGENTO_GRAPHQL_CACHE_MAX_ENTRIES",
  512,
);
const RETRY_DELAY_MS = 250;
const PHP_FATAL_SIGNATURES = [
  "allowed memory size",
  "fatal error",
  "maximum execution time",
] as const;

// ── In-flight dedupe ────────────────────────────────────────

/** Coalesce identical in-flight POSTs (same endpoint, Store header, body) to ease Magento load. */
const inflightByKey = new Map<string, Promise<unknown>>();

// ── Response cache (per-store-view) ─────────────────────────

type ResponseCacheEntry = {
  value: unknown;
  expiresAt: number;
};

const responseCache = new Map<string, ResponseCacheEntry>();

function cacheGetFresh<T>(key: string, now: number): T | undefined {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) return undefined;
  // Refresh recency so LRU eviction keeps hot entries.
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry.value as T;
}

function cacheGetStale<T>(key: string): T | undefined {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  return entry.value as T;
}

function cacheSet(key: string, value: unknown, ttlMs: number): void {
  if (ttlMs <= 0) return;
  responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  if (responseCache.size > RESPONSE_CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) responseCache.delete(oldestKey);
  }
}

// ── Concurrency limiter ─────────────────────────────────────

let activeRequests = 0;
const waitQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    return;
  }
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  activeRequests += 1;
}

function releaseSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
  const next = waitQueue.shift();
  if (next) next();
}

// ── Helpers ─────────────────────────────────────────────────

function requestCacheKey(
  endpoint: string,
  storeCode: string,
  query: string,
  variables: Record<string, unknown> | undefined,
): string {
  return JSON.stringify({
    endpoint,
    storeCode,
    query,
    variables: variables ?? {},
  });
}

function detectPhpFatal(rawBody: string, contentType: string): boolean {
  if (!rawBody) return false;
  if (contentType.includes("application/json")) return false;
  const lowered = rawBody.toLowerCase();
  return PHP_FATAL_SIGNATURES.some((sig) => lowered.includes(sig));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableMagentoError(err: unknown): boolean {
  if (!(err instanceof MagentoGraphqlError)) return false;
  if (err.isPhpFatal) return true;
  const status = err.httpStatus ?? 0;
  return status >= 500 && status < 600;
}

// ── Public API ──────────────────────────────────────────────

/**
 * Server-only GraphQL to Magento (`getGraphqlEndpoint()`).
 * Browser `ApolloClient` uses `/api/graphql-proxy` instead — DevTools will not show this POST for RSC pages such as the PLP.
 *
 * Load-management behavior (multi-store / multi-language friendly):
 *  - In-flight dedupe by `{endpoint, Store header, query, variables}` prevents duplicate POSTs
 *    from parallel RSCs (Header, Footer, PLP all need `storeConfig`).
 *  - Optional per-store-view response cache via `cacheTtlMs` — each Store header value owns its
 *    own slot, so English and Arabic don't share data.
 *  - Global concurrency limiter (default 6 concurrent to Magento, env-tunable) protects the
 *    backend from burst traffic across many store views.
 *  - One retry on transient failures (PHP fatal / 5xx). If `serveStaleOnError` is set, a cached
 *    value (even expired) is served instead of throwing.
 */
export async function magentoGraphqlFetch<TData>(
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphqlFetchOptions,
): Promise<TData> {
  const endpoint = getGraphqlEndpoint();
  if (!endpoint) {
    throw new MagentoGraphqlError(
      "Magento GraphQL endpoint is not configured. Check NEXT_PUBLIC_COMMERCE_BASE_URL or NEXT_PUBLIC_GRAPHQL_ENDPOINT.",
    );
  }

  const explicit = options?.storeViewCode?.trim();
  const storeCode =
    explicit && explicit.length > 0
      ? normalizeStoreViewCode(explicit) ?? (await getServerStoreViewCode())
      : await getServerStoreViewCode();

  const cacheKey = requestCacheKey(endpoint, storeCode, query, variables);
  const ttlMs = options?.cacheTtlMs ?? 0;
  const now = Date.now();

  if (ttlMs > 0) {
    const cached = cacheGetFresh<TData>(cacheKey, now);
    if (cached !== undefined) return cached;
  }

  const existing = inflightByKey.get(cacheKey);
  if (existing) {
    return existing as Promise<TData>;
  }

  const promise = (async () => {
    try {
      const data = await executeWithLimiterAndRetry<TData>(
        endpoint,
        storeCode,
        query,
        variables,
        options,
      );
      if (ttlMs > 0) cacheSet(cacheKey, data, ttlMs);
      return data;
    } catch (err) {
      if (options?.serveStaleOnError && isRetryableMagentoError(err)) {
        const stale = cacheGetStale<TData>(cacheKey);
        if (stale !== undefined) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[magentoGraphqlFetch] Serving stale cached value for store "${storeCode}" after transient error.`,
            );
          }
          return stale;
        }
      }
      throw err;
    }
  })().finally(() => {
    inflightByKey.delete(cacheKey);
  });

  inflightByKey.set(cacheKey, promise);
  return promise;
}

/**
 * Result shape for {@link magentoGraphqlFetchSafe}. Always resolves — callers branch on `ok`.
 * Use from RSC when you want Magento outages (PHP fatal / timeout / 5xx) to degrade silently
 * instead of surfacing in Next's dev console-error replay overlay.
 */
export type MagentoGraphqlFailureKind =
  | "phpFatal"
  | "http"
  | "network"
  | "graphql";

export type MagentoGraphqlSafeResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; error: MagentoGraphqlError; kind: MagentoGraphqlFailureKind };

/**
 * Non-throwing variant of {@link magentoGraphqlFetch}. Designed for RSC pages / components
 * where an unhandled Error (even in `try/catch`) would be captured by Next 16's RSC console
 * replay and shown as a "Console Error" in the browser dev overlay.
 *
 * When Magento is down or misbehaves, returns `{ ok: false }` — caller renders a safe fallback.
 */
export async function magentoGraphqlFetchSafe<TData>(
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphqlFetchOptions,
): Promise<MagentoGraphqlSafeResult<TData>> {
  try {
    const data = await magentoGraphqlFetch<TData>(query, variables, options);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof MagentoGraphqlError) {
      const kind: MagentoGraphqlFailureKind = err.isPhpFatal
        ? "phpFatal"
        : typeof err.httpStatus === "number"
          ? "http"
          : err.graphqlErrors?.length
            ? "graphql"
            : "network";
      return { ok: false, error: err, kind };
    }
    const wrapped = new MagentoGraphqlError(
      err instanceof Error ? err.message : "Unknown Magento GraphQL error",
    );
    return { ok: false, error: wrapped, kind: "network" };
  }
}

/** Manual invalidation (e.g. after a mutation). Call with specific store view code to target one language. */
export function invalidateMagentoGraphqlCache(predicate?: (key: string) => boolean): void {
  if (!predicate) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (predicate(key)) responseCache.delete(key);
  }
}

/**
 * Drop every cached response tied to one Magento store view. Intended for the client-side
 * store switcher — it hits this server action right before `router.refresh()` so the new
 * RSC render never picks up a stale cache entry from a previous language.
 */
export function invalidateStoreViewCache(storeViewCode: string): void {
  const needle = normalizeStoreViewCode(storeViewCode) ?? storeViewCode;
  if (!needle) return;
  const marker = `"storeCode":${JSON.stringify(needle)}`;
  invalidateMagentoGraphqlCache((key) => key.includes(marker));
}

// ── Execution pipeline ──────────────────────────────────────

async function executeWithLimiterAndRetry<TData>(
  endpoint: string,
  storeCode: string,
  query: string,
  variables: Record<string, unknown> | undefined,
  options: GraphqlFetchOptions | undefined,
): Promise<TData> {
  await acquireSlot();
  try {
    return await executeMagentoGraphqlPostWithRetry<TData>(
      endpoint,
      storeCode,
      query,
      variables,
      options,
    );
  } finally {
    releaseSlot();
  }
}

async function executeMagentoGraphqlPostWithRetry<TData>(
  endpoint: string,
  storeCode: string,
  query: string,
  variables: Record<string, unknown> | undefined,
  options: GraphqlFetchOptions | undefined,
): Promise<TData> {
  try {
    return await executeMagentoGraphqlPost<TData>(
      endpoint,
      storeCode,
      query,
      variables,
      options,
    );
  } catch (err) {
    if (!isRetryableMagentoError(err)) throw err;
    await wait(RETRY_DELAY_MS);
    return executeMagentoGraphqlPost<TData>(
      endpoint,
      storeCode,
      query,
      variables,
      options,
    );
  }
}

async function executeMagentoGraphqlPost<TData>(
  endpoint: string,
  storeCode: string,
  query: string,
  variables: Record<string, unknown> | undefined,
  options: GraphqlFetchOptions | undefined,
): Promise<TData> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Store: storeCode,
  };

  if (options?.auth === "apiKey" && config.commerce.apiKey) {
    headers.Authorization = `Bearer ${config.commerce.apiKey}`;
  }

  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    /**
     * `cache: "no-store"` is required for multi-store correctness:
     * Next's fetch Data Cache does not reliably vary on the `Store` HTTP header for POST
     * bodies across versions, so two store views of the same Magento store (e.g. `default_en`
     * vs `default_ar`) can accidentally share a cached response. We rely on our own
     * per-store-view `responseCache` for deduplication and TTL, keyed explicitly on the
     * store view code — see `requestCacheKey` / `cacheTtlMs`.
     */
    res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw new MagentoGraphqlError(
        `Magento GraphQL request timed out after ${timeoutMs}ms (store: ${storeCode}).`,
        undefined,
        504,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (!res.ok) {
    throw new MagentoGraphqlError(
      `Magento GraphQL HTTP ${res.status} ${res.statusText}`,
      undefined,
      res.status,
    );
  }

  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
  const rawBody = await res.text();
  let payload: GraphqlPayload<TData>;
  try {
    payload = JSON.parse(rawBody) as GraphqlPayload<TData>;
  } catch {
    const preview = rawBody.replace(/\s+/g, " ").slice(0, 240);
    const contentHint = contentType || "unknown content-type";
    const phpFatal = detectPhpFatal(rawBody, contentType);
    const message = phpFatal
      ? `Magento returned a PHP fatal (likely memory_limit). Body preview: ${preview || "[empty]"}`
      : `Magento GraphQL returned non-JSON response (${contentHint}). Body preview: ${preview || "[empty]"}`;
    throw new MagentoGraphqlError(message, undefined, res.status, phpFatal);
  }

  if (payload.errors?.length) {
    const messages = payload.errors
      .map((e) => e.message)
      .filter(Boolean)
      .join("; ");
    throw new MagentoGraphqlError(messages, payload.errors);
  }

  if (!payload.data) {
    throw new MagentoGraphqlError("Magento GraphQL returned no data.");
  }

  return payload.data;
}
