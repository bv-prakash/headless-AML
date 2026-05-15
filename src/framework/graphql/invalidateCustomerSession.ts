import { toast } from "react-toastify";
import { store } from "@/src/store/store";
import { logout } from "@/src/store/slices/authSlice";
import { clearWishlist } from "@/src/store/slices/wishlistSlice";
import { clearCart } from "@/src/store/slices/cartSlice";
import { clearCompare } from "@/src/store/slices/compareSlice";
import { CUSTOMER_TOKEN_KEY } from "@/src/constants/storageKeys";
import { getStoredValue } from "@/src/utils/storage";
import { resolveClientStoreViewCode } from "@/src/framework/store/resolveClientStoreViewCode";
import { writeStoreViewCookie } from "@/src/framework/store/storeViewCookie";

export const CUSTOMER_SESSION_INVALID_MESSAGE =
  "Your session has expired or is no longer valid. Please sign in again.";
export const SESSION_EXPIRED_TOAST_KEY = "magento_session_expired_toast";

let lastInvalidationAt = 0;
const DEBOUNCE_MS = 2500;

/**
 * Clears customer token and related client state, then alerts the user.
 * No-ops only when both Redux and storage show no session (already guest).
 * Debounced toast so multiple GraphQL errors in one response don’t stack toasts.
 *
 * After Redux updates, resets the Apollo cache so UI and queries don’t briefly
 * show stale customer-only data until the next navigation.
 */
export function invalidateCustomerSession(): void {
  if (typeof window === "undefined") return;

  const tokenInStorage = getStoredValue(CUSTOMER_TOKEN_KEY);
  const tokenInState = store.getState().auth.token;
  if (!tokenInStorage && !tokenInState) return;

  const now = Date.now();
  const showToast = now - lastInvalidationAt >= DEBOUNCE_MS;
  if (showToast) lastInvalidationAt = now;

  store.dispatch(logout());
  store.dispatch(clearWishlist());
  store.dispatch(clearCart());
  store.dispatch(clearCompare());

  if (showToast) {
    try {
      sessionStorage.setItem(SESSION_EXPIRED_TOAST_KEY, "1");
    } catch {}
  }

  resetApolloStoreAfterAuthChange();

  window.dispatchEvent(new CustomEvent("magento:session-expired"));

  // Keep storefront context stable after forced logout.
  const activeStoreView = resolveClientStoreViewCode();
  if (activeStoreView) writeStoreViewCookie(activeStoreView);

  // Always return shopper to home after expiry; render one-time toast there.
  if (window.location.pathname !== "/") {
    window.location.assign("/");
  }
}

/** Refetch-friendly cache reset after auth changes (logout / session expiry). */
export function resetApolloStoreAfterAuthChange(): void {
  if (typeof window === "undefined") return;
  void import("@/src/framework/graphql/apolloClient").then(({ default: client }) =>
    client.resetStore().catch(() => {}),
  );
}
