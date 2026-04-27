import {
  DEFAULT_WEBSITE_CODE,
  STORE_VIEW_COOKIE_NAME,
  getDefaultStoreViewCodeFromEnv,
  getWebsiteCodeForStoreView,
  normalizeStoreViewCode,
} from "@/src/config/storeViews";
import { STORE_VIEW_CODE_KEY } from "@/src/constants/storageKeys";

const IS_BROWSER = typeof window !== "undefined";

export function getStoredValue(key: string): string | null {
  return IS_BROWSER ? localStorage.getItem(key) : null;
}

export function setStoredValue(key: string, value: string): void {
  if (IS_BROWSER) localStorage.setItem(key, value);
}

export function removeStoredValue(key: string): void {
  if (IS_BROWSER) localStorage.removeItem(key);
}

/**
 * Reads the active store view code directly from cookie / localStorage. Inlined here
 * (instead of importing `resolveClientStoreViewCode`) to avoid a circular import —
 * that helper depends on `getStoredValue` from this module.
 */
function readClientStoreViewCode(): string {
  if (!IS_BROWSER) return getDefaultStoreViewCodeFromEnv();
  try {
    const parts = document.cookie.split("; ");
    for (const p of parts) {
      const i = p.indexOf("=");
      if (i === -1) continue;
      if (p.slice(0, i).trim() === STORE_VIEW_COOKIE_NAME) {
        const fromCookie = decodeURIComponent(p.slice(i + 1).trim());
        const normalized = normalizeStoreViewCode(fromCookie);
        if (normalized) return normalized;
        break;
      }
    }
    const fromLs = normalizeStoreViewCode(localStorage.getItem(STORE_VIEW_CODE_KEY));
    if (fromLs) return fromLs;
  } catch {
    /* fall through to env default */
  }
  return getDefaultStoreViewCodeFromEnv();
}

/**
 * Appends the current Magento **website** scope to a base key so parallel websites
 * keep separate cart / compare / wishlist state:
 *   `magento_cart_id` → `magento_cart_id::proluxe_lighting`
 * Safe on the server (returns the unscoped key; I/O no-ops anyway).
 */
function scopedKey(baseKey: string): string {
  if (!IS_BROWSER) return `${baseKey}::${DEFAULT_WEBSITE_CODE}`;
  return `${baseKey}::${getWebsiteCodeForStoreView(readClientStoreViewCode())}`;
}

export function getScopedStoredValue(baseKey: string): string | null {
  return getStoredValue(scopedKey(baseKey));
}

export function setScopedStoredValue(baseKey: string, value: string): void {
  setStoredValue(scopedKey(baseKey), value);
}

export function removeScopedStoredValue(baseKey: string): void {
  removeStoredValue(scopedKey(baseKey));
}
