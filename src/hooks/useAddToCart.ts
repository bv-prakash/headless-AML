import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@apollo/client/react";
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
import {
  CREATE_EMPTY_CART_MUTATION,
  type CreateEmptyCartResponse,
  type CartData,
} from "@/src/framework/graphql/mutations/cartMutations";

type MutationFn = (cartId: string) => Promise<CartData | null | undefined>;

export function useAddToCart(productName: string) {
  const dispatch = useAppDispatch();
  const storeCartId = useAppSelector((s) => s.cart.cartId);
  const [createEmptyCart] = useMutation<CreateEmptyCartResponse>(
    CREATE_EMPTY_CART_MUTATION,
  );
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (mutation: MutationFn) => {
      setLoading(true);
      try {
        let cartId = storeCartId ?? getStoredValue(CART_ID_KEY);

        if (!cartId) {
          const { data } = await createEmptyCart();
          cartId = data?.createEmptyCart ?? null;
          if (cartId) dispatch(setCartId(cartId));
        }

        if (!cartId) {
          toast.error("Could not create cart. Please try again.");
          return;
        }

        try {
          const cart = await mutation(cartId);
          if (!mountedRef.current) return;
          if (cart) dispatch(setCart(cart));
          dispatch(openMinicart());
          toast.success(`${productName} added to cart.`);
        } catch (err) {
          const msg = getErrorMessage(err, "");

          if (isStaleCartError(msg)) {
            dispatch(clearCart());
            const { data: freshData } = await createEmptyCart();
            cartId = freshData?.createEmptyCart ?? null;
            if (!cartId) {
              toast.error("Could not create cart. Please try again.");
              return;
            }
            dispatch(setCartId(cartId));
            const cart = await mutation(cartId);
            if (!mountedRef.current) return;
            if (cart) dispatch(setCart(cart));
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
        if (mountedRef.current) setLoading(false);
      }
    },
    [storeCartId, productName, createEmptyCart, dispatch],
  );

  return { execute, loading };
}
