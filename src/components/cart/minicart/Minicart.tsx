"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type TransitionEvent,
} from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { selectMinicartProps } from "@/src/store/selectors";
import {
  closeMinicart,
  setCart,
  clearCart,
} from "@/src/store/slices/cartSlice";
import { formatPrice } from "@/src/utils/format";
import { isStaleCartError } from "@/src/utils/errors";
import MinicartItem from "@/src/components/cart/minicart/MinicartItem";
import {
  CART_QUERY,
  type CartQueryResponse,
  type CartQueryVariables,
} from "@/src/framework/graphql/cart/queries/getCart";
import {
  REMOVE_CART_ITEM_MUTATION,
  type RemoveCartItemResponse,
  type RemoveCartItemVariables,
} from "@/src/framework/graphql/cart/mutations/removeCartItem";
import {
  UPDATE_CART_ITEM_MUTATION,
  type UpdateCartItemResponse,
  type UpdateCartItemVariables,
} from "@/src/framework/graphql/cart/mutations/updateCartItem";
import type { CartItem } from "@/src/framework/graphql/cart/types";
import { writeCartQueryToCache } from "@/src/framework/graphql/writeCartQueryCache";

type ValidCartItem = CartItem & {
  product: NonNullable<CartItem["product"]>;
  prices: NonNullable<CartItem["prices"]>;
};

export default function Minicart() {
  const dispatch = useAppDispatch();
  const { open: isOpen, cartId, cart, totalQuantity } = useAppSelector(selectMinicartProps);

  const [visible, setVisible] = useState(false);
  const [sliding, setSliding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSliding(true));
      });
    } else {
      setSliding(false);
    }
  }, [isOpen]);

  const handlePanelTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (!isOpen) {
        setVisible(false);
      }
    },
    [isOpen],
  );

  const { data, loading, error } = useQuery<CartQueryResponse, CartQueryVariables>(
    CART_QUERY,
    {
      variables: { cartId: cartId ?? "" },
      skip: !cartId || !isOpen,
      fetchPolicy: "cache-and-network",
    },
  );

  useEffect(() => {
    if (data?.cart) dispatch(setCart(data.cart));
  }, [data, dispatch]);

  useEffect(() => {
    if (!error) return;
    if (isStaleCartError(error.message)) dispatch(clearCart());
  }, [error, dispatch]);

  const [removeItem, { loading: removing }] = useMutation<
    RemoveCartItemResponse,
    RemoveCartItemVariables
  >(REMOVE_CART_ITEM_MUTATION, {
    update(cache, result, { variables }) {
      const id = variables?.cartId;
      const cart = result.data?.removeItemFromCart?.cart;
      if (!id || !cart) return;
      writeCartQueryToCache(cache, id, cart);
    },
  });

  const [updateItem, { loading: updating }] = useMutation<
    UpdateCartItemResponse,
    UpdateCartItemVariables
  >(UPDATE_CART_ITEM_MUTATION, {
    update(cache, result, { variables }) {
      const id = variables?.cartId;
      const cart = result.data?.updateCartItems?.cart;
      if (!id || !cart) return;
      writeCartQueryToCache(cache, id, cart);
    },
  });

  const handleClose = useCallback(() => {
    dispatch(closeMinicart());
  }, [dispatch]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  const handleRemove = useCallback(
    async (itemUid: string, productName: string) => {
      if (!cartId) return;
      try {
        const { data: result } = await removeItem({
          variables: { cartId, cartItemUid: itemUid },
        });
        if (result?.removeItemFromCart?.cart) {
          dispatch(setCart(result.removeItemFromCart.cart));
        }
        toast.success(`${productName} removed from cart.`);
      } catch {
        toast.error("Failed to remove item.");
      }
    },
    [cartId, removeItem, dispatch],
  );

  const handleUpdateQty = useCallback(
    async (itemUid: string, newQty: number) => {
      if (!cartId || newQty < 1) return;
      try {
        const { data: result } = await updateItem({
          variables: { cartId, cartItemUid: itemUid, quantity: newQty },
        });
        if (result?.updateCartItems?.cart) {
          dispatch(setCart(result.updateCartItems.cart));
        }
      } catch {
        toast.error("Failed to update quantity.");
      }
    },
    [cartId, updateItem, dispatch],
  );

  const items = useMemo(
    () => (cart?.items ?? []).filter(
      (i): i is ValidCartItem => i.product != null && i.prices != null,
    ),
    [cart?.items],
  );
  const subtotal = cart?.prices?.subtotal_excluding_tax;
  const grandTotal = cart?.prices?.grand_total;
  const isBusy = removing || updating;

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out ${
          sliding ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-over from the right */}
      <div
        id="minicart-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-[440px] flex-col overflow-hidden rounded-l-xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          sliding ? "translate-x-0" : "translate-x-full"
        }`}
        onTransitionEnd={handlePanelTransitionEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          {totalQuantity > 0 && (
            <div className="text-base lg-custom:text-lg! font-bold uppercase">
              {totalQuantity} {totalQuantity === 1 ? "item in cart" : "items in cart"}
            </div>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="text-black flex hover:text-theme-primary transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <i className="icon-cross-icon text-[22px] leading-1" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {loading && !cart && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 rounded-full border-[3px] border-gray-200 border-t-theme-primary animate-spin" />
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <i className="icon-cart text-4xl mb-3 block" aria-hidden="true" />
              <p className="text-base">Your cart is empty.</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 text-theme-primary underline hover:no-underline text-sm cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          )}

          {items.length > 0 && (
            <ul className="space-y-4">
              {items.map((item) => (
                <MinicartItem
                  key={item.uid}
                  item={item}
                  isBusy={isBusy}
                  onRemove={handleRemove}
                  onUpdateQty={handleUpdateQty}
                  onClose={handleClose}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-5">
            {subtotal && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">
                  {formatPrice(subtotal.value, subtotal.currency)}
                </span>
              </div>
            )}
            {grandTotal && (
              <div className="flex justify-between font-bold">
                <span>Grand Total</span>
                <span className="text-[22px] leading-1 lg-custom:text-2xl! font-bold">
                  {formatPrice(grandTotal.value, grandTotal.currency)}
                </span>
              </div>
            )}
            <Link
              href="/checkout"
              onClick={handleClose}
              className="block w-full text-center bg-theme-primary text-white font-bold py-3 px-4 uppercase text-sm hover:opacity-90 transition-opacity"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/cart"
              onClick={handleClose}
              className="block w-full text-center text-theme-primary hover:underline text-sm uppercase font-semibold cursor-pointer py-1"
            >
              view and edit cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
