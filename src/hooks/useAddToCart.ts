import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  setCart,
  setCartId,
  openMinicart,
  clearCart,
} from "@/src/store/slices/cartSlice";
import { CART_ID_KEY } from "@/src/constants/storageKeys";
import { getStoredValue } from "@/src/utils/storage";
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

export function useAddToCart(productName: string) {
  const dispatch = useAppDispatch();
  const storeCartId = useAppSelector((s) => s.cart.cartId);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyCartSuccess = useCallback((cartId: string, cart: CartData) => {
    dispatch(setCart(cart));
    writeCartQueryToCache(apolloClient.cache, cartId, cart);
  }, [dispatch]);

  /** Fire-and-forget: creates guest cart early (deduped) so the click path often skips `createEmptyCart`. */
  const prefetchCart = useCallback(() => {
    if (storeCartId ?? getStoredValue(CART_ID_KEY)) return;
    void ensureGuestCartId().then((id) => {
      if (id) dispatch(setCartId(id));
    });
  }, [storeCartId, dispatch]);

  const execute = useCallback(
    async (mutation: MutationFn) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setLoading(true);
      try {
        let cartId = storeCartId ?? getStoredValue(CART_ID_KEY);

        if (!cartId) {
          cartId = await ensureGuestCartId();
          if (cartId) dispatch(setCartId(cartId));
        }

        if (!cartId) {
          toast.error("Could not create cart. Please try again.");
          return;
        }

        try {
          const cart = await mutation(cartId);
          if (!mountedRef.current) return;
          if (cart) applyCartSuccess(cartId, cart);
          dispatch(openMinicart());
          toast.success(`${productName} added to cart.`);
        } catch (err) {
          const msg = getErrorMessage(err, "");

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
            const cart = await mutation(cartId);
            if (!mountedRef.current) return;
            if (cart) applyCartSuccess(cartId, cart);
            dispatch(openMinicart());
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
        inFlightRef.current = false;
        if (mountedRef.current) setLoading(false);
      }
    },
    [storeCartId, productName, dispatch, applyCartSuccess],
  );

  return { execute, loading, prefetchCart };
}
