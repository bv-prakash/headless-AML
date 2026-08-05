import config from "@/src/config/config";
import type { LanguageCode } from "@/src/i18n/commonLabels";
import { getGraphqlEndpoint } from "@/src/framework/graphql/getGraphqlEndpoint";

/** Cookie name — must match server reads in `getServerStoreViewCode`. */
export const STORE_VIEW_COOKIE_NAME = "magento_store_view";

/** Keys for `html[data-home-theme]` + optional theme CSS files under `src/style/{id}Theme/`. */
export const HOME_THEME_IDS = ["default", "proluxe"] as const;
export type HomeThemeId = (typeof HOME_THEME_IDS)[number];

export type StoreViewOption = {
  readonly code: string;
  readonly label: string;
  /** Magento store code (same store can have multiple store views / languages). */
  readonly storeCode?: string;
  readonly group: string;
  /**
   * Magento **website** code. Carts / wishlist / compare cannot be shared across websites
   * (`Can't assign cart to store in different website`), so local storage for those is scoped
   * by this code. Store views that share a website share one cart.
   */
  readonly websiteCode: string;
  /** UI language mapped to this store view. */
  readonly languageCode?: LanguageCode;
  /** Language label shown in language switcher. */
  readonly languageLabel?: string;
  /** Native language label shown in language switcher. */
  readonly nativeLanguageLabel?: string;
  /** Which home theme id is set on `<html data-home-theme>` for scoped CSS (see `app/layout.tsx`). */
  readonly homeThemeId?: HomeThemeId;
  /**
   * Magento root category **entity id** for this store (Admin: Stores → All Stores →
   * [store group] → Root Category). When unset, the app uses `storeConfig.root_category_uid`
   * when available, otherwise `"2"`.
   */
  readonly categoryNavRootId?: string;
};

/**
 * Raw Magento store from GraphQL `stores` query.
 * Only minimal fields needed — `code` and `is_active`.
 */
type RawMagentoStore = {
  readonly code?: string | null;
  readonly name?: string | null;
  readonly is_active?: boolean | null;
};

/**
 * GraphQL query to fetch active Magento stores.
 * Filters for `is_active = true` to avoid disabled stores.
 */
const STORES_QUERY = `
  query {
    stores {
      code
      name
      is_active
    }
  }
`;

/**
 * Store views aligned with Magento admin (Website → Store → Store View codes).
 * `code` is the Store View code sent as the GraphQL `Store` header.
 */
export const STORE_VIEW_OPTIONS: readonly StoreViewOption[] = [
  {
    code: "default",
    label: "Default Store View",
    storeCode: "american_lighting_store",
    group: "American Lighting",
    websiteCode: "american_lighting",
    languageCode: "en",
    languageLabel: "English",
    nativeLanguageLabel: "English",
  },
  {
    code: "default_ar",
    label: "Default Store View",
    storeCode: "american_lighting_store",
    group: "American Lighting",
    websiteCode: "american_lighting",
    languageCode: "ar",
    languageLabel: "Arabic",
    nativeLanguageLabel: "العربية",
  },
  {
    code: "tinsl_lighting_store_view",
    label: "TINSL Lighting Store view",
    storeCode: "tinsl_lighting_store",
    group: "TINSL Lighting",
    websiteCode: "tinsl_lighting",
    languageCode: "en",
    languageLabel: "English",
    nativeLanguageLabel: "English",
  },
  {
    code: "proluxelighting_store_view",
    label: "Proluxe Lighting Store View",
    storeCode: "proluxe_lighting_store",
    group: "Proluxe lighting",
    websiteCode: "proluxe_lighting",
    homeThemeId: "proluxe",
    languageCode: "en",
    languageLabel: "English",
    nativeLanguageLabel: "English",
  },
  {
    code: "prizmlighting_store_view",
    label: "Prizm Lighting Store View",
    storeCode: "prizm_lighting_store",
    group: "Prizm Lighting",
    websiteCode: "prizm_lighting",
    languageCode: "en",
    languageLabel: "English",
    nativeLanguageLabel: "English",
  },
  {
    code: "brightluxlighting_store_view",
    label: "Brightlux Lighting Store View",
    storeCode: "brightlux_lighting_store",
    group: "Brightlux Lighting",
    websiteCode: "brightlux_lighting",
    languageCode: "en",
    languageLabel: "English",
    nativeLanguageLabel: "English",
  },
] as const;

export const DEFAULT_WEBSITE_CODE = STORE_VIEW_OPTIONS[0].websiteCode;

const STORE_VIEW_CODE_ALIASES: Readonly<Record<string, string>> = {
  // Backward-compatibility for previously shipped typo.
  tinsllighting_store_view: "tinsl_lighting_store_view",
};

/**
 * Metadata lookup map: store view code → metadata from STORE_VIEW_OPTIONS.
 * Used to merge Magento store data with frontend metadata (theme, language, etc).
 */
const METADATA_MAP = new Map(STORE_VIEW_OPTIONS.map((o) => [o.code, o]));

/** Dynamic cache: initially populated with static options, updated by hydration. */
let HYDRATED_STORE_OPTIONS: readonly StoreViewOption[] = STORE_VIEW_OPTIONS;

/** Cache timestamp for detecting stale hydration. */
let hydrationCacheTimestamp = 0;

/** Cache TTL: 5 minutes. */
const HYDRATION_CACHE_TTL_MS = 5 * 60 * 1000;

/** Promise deduplication: ongoing hydration request (if any). */
let hydrationPromise: Promise<readonly StoreViewOption[]> | null = null;

/** Dynamically built from active Magento stores; cached and updated during hydration. */
let allowedStoreCodeSet = new Set(STORE_VIEW_OPTIONS.map((o) => o.code));

export function getDefaultStoreViewCodeFromEnv(): string {
  const fromEnv = config.commerce.storeCode?.trim();
  const normalizedFromEnv = fromEnv ? (STORE_VIEW_CODE_ALIASES[fromEnv] ?? fromEnv) : undefined;
  if (normalizedFromEnv && allowedStoreCodeSet.has(normalizedFromEnv))
    return normalizedFromEnv;
  return HYDRATED_STORE_OPTIONS[0]?.code ?? "default";
}

export function normalizeStoreViewCode(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  const normalized = STORE_VIEW_CODE_ALIASES[t] ?? t;
  return allowedStoreCodeSet.has(normalized) ? normalized : null;
}

/**
 * Loose normalization for early client boot before strict validation can apply.
 * Keeps known alias mapping but does not require membership in static options.
 */
export function normalizeStoreViewCodeLoose(
  raw: string | null | undefined,
): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return STORE_VIEW_CODE_ALIASES[t] ?? t;
}

/**
 * Client source resolver used by language/store bootstrapping:
 * prefer cookie, then local storage, then env default.
 */
export function resolveStoreViewCodeForClientSources(
  fromCookie: string | null | undefined,
  fromStorage: string | null | undefined,
): string {
  return (
    normalizeStoreViewCodeLoose(fromCookie) ??
    normalizeStoreViewCodeLoose(fromStorage) ??
    getDefaultStoreViewCodeFromEnv()
  );
}

/**
 * Request/proxy resolver:
 * prefer strict validated header/cookie values, then loose values, then fallback.
 */
export function resolveStoreViewCodeForRequest(
  fromHeader: string | null | undefined,
  fromCookie: string | null | undefined,
  fallback: string,
): string {
  return (
    normalizeStoreViewCode(fromHeader) ??
    normalizeStoreViewCodeLoose(fromHeader) ??
    normalizeStoreViewCode(fromCookie) ??
    normalizeStoreViewCodeLoose(fromCookie) ??
    fallback
  );
}

/** Explicit nav root from config, if any (see {@link StoreViewOption.categoryNavRootId}). */
export function getCategoryNavRootIdOverride(
  storeViewCode: string,
): string | undefined {
  const id = HYDRATED_STORE_OPTIONS.find((o) => o.code === storeViewCode)
    ?.categoryNavRootId?.trim();
  return id || undefined;
}

/**
 * Website code for the given store view. Used to scope cart/compare/wishlist storage
 * (Magento rejects cross-website cart mutations). Falls back to the default website.
 */
export function getWebsiteCodeForStoreView(storeViewCode: string): string {
  return (
    HYDRATED_STORE_OPTIONS.find((o) => o.code === storeViewCode)?.websiteCode ??
    DEFAULT_WEBSITE_CODE
  );
}

/** Value for `<html data-home-theme>` — use in CSS as `html[data-home-theme="proluxe"]`. */
export function getHomeThemeId(storeViewCode: string): HomeThemeId {
  const raw = HYDRATED_STORE_OPTIONS.find((o) => o.code === storeViewCode)
    ?.homeThemeId;
  if (raw && HOME_THEME_IDS.some((id) => id === raw)) return raw;
  return "default";
}

export type StoreLanguageOption = {
  readonly storeViewCode: string;
  readonly languageCode: LanguageCode;
  readonly languageLabel: string;
  readonly nativeLanguageLabel: string;
};

function getStoreScopeKey(option: StoreViewOption): string {
  return option.storeCode?.trim() || option.websiteCode;
}

export function getLanguageOptionsForStoreView(
  currentStoreViewCode: string,
): readonly StoreLanguageOption[] {
  const current =
    HYDRATED_STORE_OPTIONS.find((o) => o.code === currentStoreViewCode) ??
    HYDRATED_STORE_OPTIONS[0];

  // Primary grouping: same Magento store (same store code), which can have multiple
  // store views (e.g. en/ar). Fallback to website when storeCode is absent/misconfigured.
  const currentStoreCode = current.storeCode?.trim();
  const sameStore = currentStoreCode
    ? HYDRATED_STORE_OPTIONS.filter((o) => o.storeCode?.trim() === currentStoreCode)
    : [];
  const scoped =
    sameStore.length > 0
      ? sameStore
      : HYDRATED_STORE_OPTIONS.filter((o) => o.websiteCode === current.websiteCode);

  const byStoreViewCode = new Map<string, StoreLanguageOption>();
  scoped.forEach((o) => {
    byStoreViewCode.set(o.code, {
      storeViewCode: o.code,
      languageCode: o.languageCode ?? "en",
      languageLabel: o.languageLabel ?? o.label ?? "English",
      nativeLanguageLabel:
        o.nativeLanguageLabel ?? o.languageLabel ?? o.label ?? "English",
    });
  });

  return [...byStoreViewCode.values()].sort((a, b) =>
    a.languageLabel.localeCompare(b.languageLabel),
  );
}

/** Preferred UI language for a store view; falls back to English. */
export function getLanguageCodeForStoreView(
  storeViewCode: string,
): LanguageCode {
  return (
    HYDRATED_STORE_OPTIONS.find((o) => o.code === storeViewCode)?.languageCode ?? "en"
  );
}

/**
 * Preferred fallback for catalog lookups when the product/category is missing in the
 * current store view (e.g. Arabic). Prefers English in the same store scope, then the
 * default env store.
 */
export function getFallbackStoreViewCode(currentStoreViewCode: string): string {
  const current =
    HYDRATED_STORE_OPTIONS.find((o) => o.code === currentStoreViewCode) ??
    HYDRATED_STORE_OPTIONS[0];

  const currentStoreCode = current.storeCode?.trim();
  const sameStore = currentStoreCode
    ? HYDRATED_STORE_OPTIONS.filter((o) => o.storeCode?.trim() === currentStoreCode)
    : [];
  const scoped =
    sameStore.length > 0
      ? sameStore
      : HYDRATED_STORE_OPTIONS.filter((o) => o.websiteCode === current.websiteCode);

  const english = scoped.find((o) => o.languageCode === "en")?.code;
  if (english) return english;
  if (scoped[0]?.code) return scoped[0].code;
  return getDefaultStoreViewCodeFromEnv();
}

export function getStoreViewOptionsForToggle(
  currentStoreViewCode: string,
  preferredLanguageCode?: LanguageCode,
): readonly StoreViewOption[] {
  const current =
    HYDRATED_STORE_OPTIONS.find((o) => o.code === currentStoreViewCode) ??
    HYDRATED_STORE_OPTIONS[0];

  const byScope = new Map<string, StoreViewOption[]>();
  HYDRATED_STORE_OPTIONS.forEach((option) => {
    const key = getStoreScopeKey(option);
    const list = byScope.get(key) ?? [];
    list.push(option);
    byScope.set(key, list);
  });

  const selected: StoreViewOption[] = [];
  byScope.forEach((options) => {
    const fromCurrent = options.find((o) => o.code === current.code);
    const fromPreferredLanguage = preferredLanguageCode
      ? options.find((o) => o.languageCode === preferredLanguageCode)
      : undefined;
    selected.push(fromCurrent ?? fromPreferredLanguage ?? options[0]);
  });

  return selected.sort((a, b) => a.group.localeCompare(b.group));
}

/**
 * Fetch and merge Magento stores with frontend metadata.
 * - Fetches active stores from Magento GraphQL
 * - Normalizes store codes using STORE_VIEW_CODE_ALIASES
 * - Merges with metadata from STORE_VIEW_OPTIONS
 * - Updates internal cache and allowed store code set
 * - Returns the merged options
 *
 * Uses browser `/api/graphql-proxy` or server-side `getGraphqlEndpoint()`.
 * Caches result for HYDRATION_CACHE_TTL_MS; deduplicates concurrent requests.
 */
export async function hydrateStoreViewOptionsFromMagento(): Promise<
  readonly StoreViewOption[]
> {
  const isFresh =
    Date.now() - hydrationCacheTimestamp < HYDRATION_CACHE_TTL_MS;
  if (isFresh && HYDRATED_STORE_OPTIONS.length > 0) {
    return HYDRATED_STORE_OPTIONS;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = (async () => {
    const endpoint =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/graphql-proxy`
        : getGraphqlEndpoint();

    if (!endpoint) {
      return HYDRATED_STORE_OPTIONS;
    }

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const defaultStoreViewCode = config.commerce.storeCode?.trim();
      if (defaultStoreViewCode && typeof window === "undefined") {
        headers.Store = defaultStoreViewCode;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: STORES_QUERY }),
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`GraphQL ${res.status} ${res.statusText}`);
      }

      const payload = (await res.json()) as { stores?: readonly RawMagentoStore[] };
      const stores = payload.stores ?? [];

      // Filter active stores and normalize codes
      const activeNormalized = stores
        .filter(
          (store): store is RawMagentoStore =>
            !!store && (store.is_active ?? true),
        )
        .map((store) => {
          const rawCode = store.code?.trim();
          if (!rawCode) return null;
          return (STORE_VIEW_CODE_ALIASES[rawCode] ?? rawCode);
        })
        .filter((code): code is string => !!code);

      // Update allowed store code set
      const newAllowedSet = new Set(activeNormalized);
      allowedStoreCodeSet = newAllowedSet;

      // Merge Magento stores with frontend metadata
      const merged: StoreViewOption[] = [];
      const seenCodes = new Set<string>();

      activeNormalized.forEach((code) => {
        if (seenCodes.has(code)) return;
        seenCodes.add(code);

        const metadata = METADATA_MAP.get(code);
        if (metadata) {
          merged.push(metadata);
        }
      });

      if (merged.length > 0) {
        HYDRATED_STORE_OPTIONS = merged;
        hydrationCacheTimestamp = Date.now();
      } else {
        // Fallback to static if no active stores returned
        HYDRATED_STORE_OPTIONS = STORE_VIEW_OPTIONS;
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "Failed to hydrate store view options from Magento GraphQL.",
          error,
        );
      }
      // Keep previous/default options on error
    }

    hydrationPromise = null;
    return HYDRATED_STORE_OPTIONS;
  })();

  return hydrationPromise;
}

/**
 * Get currently hydrated store view options (includes active stores merged with metadata).
 * Before hydration completes, returns static STORE_VIEW_OPTIONS.
 * Safe to call before or after `hydrateStoreViewOptionsFromMagento()`.
 */
export function getHydratedStoreViewOptions(): readonly StoreViewOption[] {
  return HYDRATED_STORE_OPTIONS;
}
