import { STORE_VIEW_COOKIE_NAME } from "@/src/config/storeViews";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Persists the active Magento store view for **subsequent** document/RSC requests.
 * Must stay in sync with {@link getServerStoreViewCode} / {@link resolveClientStoreViewCode}.
 */
export function writeStoreViewCookie(code: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${STORE_VIEW_COOKIE_NAME}=${encodeURIComponent(code)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}
