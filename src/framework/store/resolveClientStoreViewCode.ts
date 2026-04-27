import { STORE_VIEW_CODE_KEY } from "@/src/constants/storageKeys";
import {
  getDefaultStoreViewCodeFromEnv,
  normalizeStoreViewCode,
  STORE_VIEW_COOKIE_NAME,
} from "@/src/config/storeViews";
import { getStoredValue } from "@/src/utils/storage";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ");
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i === -1) continue;
    const k = p.slice(0, i).trim();
    if (k === name) return decodeURIComponent(p.slice(i + 1).trim());
  }
  return null;
}

/**
 * Resolves active store view on the browser.
 * **Cookie first** (same source as SSR `getServerStoreViewCode`), then localStorage, then env —
 * so Apollo `Store` matches RSC/catalog after toggling store or clearing only one storage.
 */
export function resolveClientStoreViewCode(): string {
  return (
    normalizeStoreViewCode(readCookie(STORE_VIEW_COOKIE_NAME)) ??
    normalizeStoreViewCode(getStoredValue(STORE_VIEW_CODE_KEY)) ??
    getDefaultStoreViewCodeFromEnv()
  );
}
