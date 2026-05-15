import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  setCart,
  setCartId,
  clearCart,
} from "@/src/store/slices/cartSlice";
import { CART_ID_KEY } from "@/src/constants/storageKeys";
import { getScopedStoredValue } from "@/src/utils/storage";
import { getErrorMessage, isStaleCartError } from "@/src/utils/errors";
import { ensureGuestCartId } from "@/src/framework/cart/ensureGuestCart";
import {
  applySyncedCart,
  syncCartAfterLogin,
} from "@/src/framework/cart/syncCartAfterLogin";
import apolloClient from "@/src/framework/graphql/apolloClient";
import { store } from "@/src/store/store";
import { writeCartQueryToCache } from "@/src/framework/graphql/writeCartQueryCache";
import type { CartData } from "@/src/framework/graphql/mutations/cartMutations";

type MutationFn = (cartId: string) => Promise<CartData | null | undefined>;
const ADD_TO_CART_TIMEOUT_MS = 12_000;
const INSUFFICIENT_STOCK_COOLDOWN_MS = 20_000;
const insufficientStockUntilBySku = new Map<string, number>();

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeoutPromise]) as Promise<T>;
}

export function useAddToCart(productName: string, sku?: string) {
  const dispatch = useAppDispatch();
  const storeCartId = useAppSelector((s) => s.cart.cartId);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const loadingResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Strict Mode mounts/unmounts effects in development; always mark current mount as active.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (loadingResetTimerRef.current) {
        window.clearTimeout(loadingResetTimerRef.current);
        loadingResetTimerRef.current = null;
      }
    };
  }, []);

  const applyCartSuccess = useCallback((cartId: string, cart: CartData) => {
    // Prioritize Redux update so minicart reflects immediately.
    dispatch(setCart(cart));
    // Defer Apollo cache write to avoid blocking UI feedback.
    setTimeout(() => {
      writeCartQueryToCache(apolloClient.cache, cartId, cart);
    }, 0);
  }, [dispatch]);

  const stopLoading = useCallback(() => {
    inFlightRef.current = false;
    if (loadingResetTimerRef.current) {
      window.clearTimeout(loadingResetTimerRef.current);
      loadingResetTimerRef.current = null;
    }
    if (mountedRef.current) setLoading(false);
  }, []);

  /** Fire-and-forget: creates guest cart early (deduped) so the click path often skips `createEmptyCart`. */
  const prefetchCart = useCallback(() => {
    if (storeCartId ?? getScopedStoredValue(CART_ID_KEY)) return;
    void ensureGuestCartId().then((id) => {
      if (id && id !== store.getState().cart.cartId) dispatch(setCartId(id));
    });
  }, [storeCartId, dispatch]);

  const execute = useCallback(
    async (mutation: MutationFn) => {
      if (inFlightRef.current) return;
      if (sku) {
        const blockedUntil = insufficientStockUntilBySku.get(sku) ?? 0;
        if (blockedUntil > Date.now()) {
          toast.info("Requested quantity is currently unavailable. Please try later.");
          return;
        }
      }
      inFlightRef.current = true;
      setLoading(true);
      if (loadingResetTimerRef.current) {
        window.clearTimeout(loadingResetTimerRef.current);
      }
      // Fail-safe: never keep Add-to-Cart spinner stuck indefinitely.
      loadingResetTimerRef.current = window.setTimeout(() => {
        inFlightRef.current = false;
        if (mountedRef.current) setLoading(false);
      }, 15000);
      try {
        let cartId = storeCartId ?? getScopedStoredValue(CART_ID_KEY);

        if (!cartId) {
          cartId = await ensureGuestCartId();
          if (cartId) dispatch(setCartId(cartId));
        }

        if (!cartId) {
          toast.error("Could not create cart. Please try again.");
          return;
        }

        try {
          const cart = await withTimeout(
            mutation(cartId),
            ADD_TO_CART_TIMEOUT_MS,
            "Add to cart timed out. Please try again.",
          );
          if (!mountedRef.current) return;
          // End CTA loader as soon as add-to-cart succeeds.
          stopLoading();
          if (cart) {
            applyCartSuccess(cartId, cart);
          }
          toast.success(`${productName} added to cart.`);
        } catch (err) {
          const msg = getErrorMessage(err, "");
          if (sku && /not enough items for sale/i.test(msg)) {
            insufficientStockUntilBySku.set(
              sku,
              Date.now() + INSUFFICIENT_STOCK_COOLDOWN_MS,
            );
          }

          if (isStaleCartError(msg)) {
            dispatch(clearCart());
            if (store.getState().auth.isLoggedIn) {
              const synced = await syncCartAfterLogin(null, dispatch);
              if (synced) applySyncedCart(dispatch, synced);
              cartId = store.getState().cart.cartId;
            } else {
              cartId = await ensureGuestCartId();
              if (cartId) dispatch(setCartId(cartId));
            }
            if (!cartId) {
              toast.error("Could not refresh cart. Please try again.");
              return;
            }
            const cart = await withTimeout(
              mutation(cartId),
              ADD_TO_CART_TIMEOUT_MS,
              "Add to cart timed out. Please try again.",
            );
            if (!mountedRef.current) return;
            stopLoading();
            if (cart) {
              applyCartSuccess(cartId, cart);
            }
            toast.success(`${productName} added to cart.`);
          } else {
            throw err;
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          toast.error(getErrorMessage(err, "Failed to add to cart."));
        }
      } finally {
        stopLoading();
      }
    },
    [storeCartId, sku, dispatch, applyCartSuccess, stopLoading, productName],
  );

  return { execute, loading, prefetchCart };
}
