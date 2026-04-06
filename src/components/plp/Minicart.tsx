"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  closeMinicart,
  setCart,
  clearCart,
} from "@/src/store/slices/cartSlice";
import { formatPrice } from "@/src/utils/format";
import {
  CART_QUERY,
  REMOVE_CART_ITEM_MUTATION,
  UPDATE_CART_ITEM_MUTATION,
  type CartQueryResponse,
  type CartQueryVariables,
  type RemoveCartItemResponse,
  type RemoveCartItemVariables,
  type UpdateCartItemResponse,
  type UpdateCartItemVariables,
} from "@/src/framework/graphql/mutations/cartMutations";

export default function Minicart() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.cart.open);
  const cartId = useAppSelector((state) => state.cart.cartId);
  const cart = useAppSelector((state) => state.cart.cart);
  const totalQuantity = useAppSelector((state) => state.cart.totalQuantity);
  const drawerRef = useRef<HTMLDivElement>(null);

  const { data, loading, error } = useQuery<CartQueryResponse, CartQueryVariables>(
    CART_QUERY,
    {
      variables: { cartId: cartId ?? "" },
      skip: !cartId,
      fetchPolicy: "cache-and-network",
    },
  );

  useEffect(() => {
    if (data?.cart) {
      dispatch(setCart(data.cart));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (!error) return;
    const msg = error.message.toLowerCase();
    if (
      msg.includes("cannot perform operations on cart") ||
      msg.includes("could not find a cart")
    ) {
      dispatch(clearCart());
    }
  }, [error, dispatch]);

  const [removeItem, { loading: removing }] = useMutation<
    RemoveCartItemResponse,
    RemoveCartItemVariables
  >(REMOVE_CART_ITEM_MUTATION);

  const [updateItem, { loading: updating }] = useMutation<
    UpdateCartItemResponse,
    UpdateCartItemVariables
  >(UPDATE_CART_ITEM_MUTATION);

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
    async (itemId: string, productName: string) => {
      if (!cartId) return;
      try {
        const { data: result } = await removeItem({
          variables: { cartId, cartItemId: Number(itemId) },
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
    async (itemId: string, newQty: number) => {
      if (!cartId || newQty < 1) return;
      try {
        const { data: result } = await updateItem({
          variables: { cartId, cartItemId: Number(itemId), quantity: newQty },
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

  const items = cart?.items ?? [];
  const subtotal = cart?.prices?.subtotal_excluding_tax;
  const grandTotal = cart?.prices?.grand_total;
  const isBusy = removing || updating;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[400px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold uppercase">
            My Cart
            {totalQuantity > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-black transition-colors cursor-pointer p-1"
            aria-label="Close cart"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
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
                <li
                  key={item.id}
                  className={`flex gap-3 pb-4 border-b border-gray-100 last:border-0 ${isBusy ? "opacity-60 pointer-events-none" : ""}`}
                >
                  {/* Product image */}
                  <div className="w-[70px] h-[70px] shrink-0 border border-gray-200 rounded overflow-hidden">
                    {item.product.small_image?.url ? (
                      <Image
                        src={item.product.small_image.url}
                        alt={item.product.name}
                        width={70}
                        height={70}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      SKU: {item.product.sku}
                    </p>
                    <p className="text-sm font-bold text-black mt-1">
                      {formatPrice(
                        item.prices.row_total.value,
                        item.prices.row_total.currency,
                      )}
                    </p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQty(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1 || isBusy}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQty(item.id, item.quantity + 1)
                        }
                        disabled={isBusy}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id, item.product.name)}
                        disabled={isBusy}
                        className="ml-auto text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-40"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" />
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 010-2H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM6 1.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3">
            {subtotal && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">
                  {formatPrice(subtotal.value, subtotal.currency)}
                </span>
              </div>
            )}
            {grandTotal && (
              <div className="flex justify-between text-base font-bold">
                <span>Grand Total</span>
                <span>
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
            <button
              type="button"
              onClick={handleClose}
              className="block w-full text-center text-theme-primary underline hover:no-underline text-sm cursor-pointer py-1"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
