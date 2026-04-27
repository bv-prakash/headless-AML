import { cache } from "react";
import {
  getDefaultStoreViewCodeFromEnv,
  normalizeStoreViewCode,
  STORE_VIEW_COOKIE_NAME,
} from "@/src/config/storeViews";

export { normalizeStoreViewCode, STORE_VIEW_COOKIE_NAME };

/**
 * Fallback when no per-request store is available (env / build defaults).
 * @deprecated Prefer {@link getDefaultStoreViewCodeFromEnv} — name kept for existing imports.
 */
export function getActiveStoreCode(): string {
  return getDefaultStoreViewCodeFromEnv();
}

export { getDefaultStoreViewCodeFromEnv };

/**
 * Resolves store view for server `fetch` / Apollo during a request (reads cookie set by the client toggle).
 * Wrapped in `cache` so parallel server components await the same resolution once per request.
 */
export const getServerStoreViewCode = cache(async (): Promise<string> => {
  const fallback = getDefaultStoreViewCodeFromEnv();
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const raw = jar.get(STORE_VIEW_COOKIE_NAME)?.value;
    return normalizeStoreViewCode(raw) ?? fallback;
  } catch {
    return fallback;
  }
});
