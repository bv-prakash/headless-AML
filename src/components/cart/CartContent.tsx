"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { selectCartPageProps } from "@/src/store/selectors";
import { setCart, clearCart } from "@/src/store/slices/cartSlice";
import { formatPrice } from "@/src/utils/format";
import { isStaleCartError } from "@/src/utils/errors";
import QuantitySelector from "@/src/components/common/controls/QuantitySelector";
import ConfigurableItemOptions from "@/src/components/cart/item-options/ConfigurableItemOptions";
import BundleItemOptions from "@/src/components/cart/item-options/BundleItemOptions";
import DownloadableItemOptions from "@/src/components/cart/item-options/DownloadableItemOptions";
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
import type { CartItem, CartData } from "@/src/framework/graphql/cart/types";
import { buildProductEditHref } from "@/src/utils/params";
import { writeCartQueryToCache } from "@/src/framework/graphql/writeCartQueryCache";

type ValidCartItem = CartItem & {
  product: NonNullable<CartItem["product"]>;
  prices: NonNullable<CartItem["prices"]>;
};

export default function CartContent() {
  const dispatch = useAppDispatch();
  const { cartId, cart, hydrated } = useAppSelector(selectCartPageProps);
  const [clearing, setClearing] = useState(false);

  const { data, loading, error } = useQuery<CartQueryResponse, CartQueryVariables>(
    CART_QUERY,
    {
      variables: { cartId: cartId ?? "" },
      skip: !cartId,
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

  const items = (cart?.items ?? []).filter(
    (i): i is ValidCartItem => i.product != null && i.prices != null,
  );

  const handleClearCart = useCallback(async () => {
    if (!cartId || items.length === 0) return;
    if (
      !globalThis.confirm(
        "Remove all items from your cart? This cannot be undone.",
      )
    ) {
      return;
    }
    setClearing(true);
    try {
      let lastCart: CartData | null = null;
      for (const item of items) {
        const { data } = await removeItem({
          variables: { cartId, cartItemUid: item.uid },
        });
        lastCart = data?.removeItemFromCart?.cart ?? null;
      }
      if (lastCart) {
        dispatch(setCart(lastCart));
      }
      toast.success("All items were removed from your cart.");
    } catch {
      toast.error("Failed to clear the cart. Please try again.");
    } finally {
      setClearing(false);
    }
  }, [cartId, items, removeItem, dispatch]);
  const subtotal = cart?.prices?.subtotal_excluding_tax;
  const grandTotal = cart?.prices?.grand_total;
  const isBusy = removing || updating || clearing;

  if (!hydrated || (loading && !cart)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 rounded-full border-[3px] border-gray-200 border-t-theme-primary animate-spin" />
      </div>
    );
  }

  if (!cartId || items.length === 0) {
    return (
      <div className="text-center py-20">
        <i className="icon-cart text-5xl text-gray-300 mb-4 block" aria-hidden="true" />
        <p className="text-lg text-gray-500 mb-6">Your cart is empty.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center font-semibold h-9 md:h-10 px-4 text-base gap-2 bg-theme-primary text-white border border-theme-primary hover:bg-white hover:text-theme-primary transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg-custom:flex-row gap-8">
      {/* Items table */}
      <div className="flex-1 min-w-0 overflow-x-auto">
        {/* Desktop table */}
        <table className="hidden md:table w-full border-collapse">
          <thead>
            <tr className="bg-f0f0f0 not-even:font-bold uppercase text-black">
              <th className="text-left md:pl-7.5 py-2 md:py-4">Product</th>
              <th className="text-center py-2 md:py-4 px-2.5">Price</th>
              <th className="text-center py-2 md:py-4 px-2.5">Qty</th>
              <th className="text-right py-2 md:py-4 px-2.5">Subtotal</th>
              <th className="py-2 md:py-4 px-2.5 w-20 text-center md:pr-7.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const unitPrice = item.quantity > 0
                ? item.prices.row_total.value / item.quantity
                : item.prices.row_total.value;

              return (
                <tr
                  key={item.uid}
                  className={`border-b border-gray-200 transition-opacity ${isBusy ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {/* Product */}
                  <td className="py-5 md:pl-7.5">
                    <div className="flex gap-4 items-center min-w-0">
                      <div className="w-[100px] h-[100px] overflow-hidden">
                        {item.product.small_image?.url ? (
                          <Image
                            src={item.product.small_image.url}
                            alt={item.product.name}
                            width={100}
                            height={100}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-black line-clamp-2 mb-1">{item.product.name}</p>

                        {item.configurable_options && <ConfigurableItemOptions options={item.configurable_options} />}
                        {item.bundle_options && <BundleItemOptions options={item.bundle_options} />}
                        {item.links && <DownloadableItemOptions links={item.links} />}

                        <p className="text-sm text-black mt-1.5"><strong>SKU:</strong> {item.product.sku}</p>
                      </div>
                    </div>
                  </td>

                  {/* Unit price */}
                  <td className="py-5 px-4 font-normal text-center align-middle whitespace-nowrap">
                    {formatPrice(unitPrice, item.prices.row_total.currency)}
                  </td>

                  {/* Quantity */}
                  <td className="py-5 px-4 align-middle">
                    <div className="flex justify-center">
                      <QuantitySelector
                        itemKey={`cart-${item.uid}`}
                        defaultValue={item.quantity}
                        disabled={isBusy}
                        onChange={(qty) => handleUpdateQty(item.uid, qty)}
                        size="lg"
                      />
                    </div>
                  </td>

                  {/* Row total */}
                  <td className="py-5 px-4 font-bold text-right align-middle whitespace-nowrap">
                    {formatPrice(item.prices.row_total.value, item.prices.row_total.currency)}
                  </td>

                  {/* Actions */}
                  <td className="py-5 md:pr-7.5 align-middle">
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        href={buildProductEditHref(
                          item.product.url_key,
                          item.product.sku,
                          item.quantity,
                        )}
                        className="text-black hover:text-theme-primary transition-colors"
                        aria-label={`Edit ${item.product.name}`}
                      >
                        <i className="icon-edit text-lg leading-1" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.uid, item.product.name)}
                        disabled={isBusy}
                        className="text-black hover:text-theme-primary transition-colors cursor-pointer disabled:opacity-40"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <i className="icon-trash text-xl leading-1" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobile cards */}
        <ul className="md:hidden divide-y divide-gray-200">
          {items.map((item) => (
            <li
              key={item.uid}
              className={`flex gap-3 py-4 transition-opacity ${isBusy ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="w-[80px] h-[80px] shrink-0 border border-gray-200 rounded overflow-hidden">
                {item.product.small_image?.url ? (
                  <Image
                    src={item.product.small_image.url}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black truncate">{item.product.name}</p>

                    {item.configurable_options && <ConfigurableItemOptions options={item.configurable_options} size="xs" />}
                    {item.bundle_options && <BundleItemOptions options={item.bundle_options} size="xs" />}
                    {item.links && <DownloadableItemOptions links={item.links} size="xs" />}

                    <p className="text-xs text-gray-500 mt-0.5">SKU: {item.product.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={buildProductEditHref(
                        item.product.url_key,
                        item.product.sku,
                        item.quantity,
                      )}
                      className="text-black hover:text-theme-primary transition-colors"
                      aria-label={`Edit ${item.product.name}`}
                    >
                     <i className="icon-edit text-lg leading-1" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.uid, item.product.name)}
                      disabled={isBusy}
                      className="text-black hover:text-theme-primary transition-colors cursor-pointer"
                      aria-label={`Remove ${item.product.name}`}
                    >
                     <i className="icon-trash text-xl leading-1" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-black mt-1">
                  {formatPrice(item.prices.row_total.value, item.prices.row_total.currency)}
                </p>
                <div className="mt-2">
                  <QuantitySelector
                    itemKey={`cart-${item.uid}`}
                    defaultValue={item.quantity}
                    disabled={isBusy}
                    onChange={(qty) => handleUpdateQty(item.uid, qty)}
                    size="sm"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-between flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center font-semibold h-9 md:h-10 px-4 text-base gap-2 border border-aaa bg-white text-gray-700 hover:bg-theme-primary hover:text-white hover:border-theme-primary transition-colors"
          >
            <i className="icon-back-arrow text-sm leading-none before:font-bold" aria-hidden="true" />
            Continue Shopping
          </Link>
          <button
            type="button"
            onClick={handleClearCart}
            disabled={isBusy}
            className="inline-flex items-center justify-center font-semibold h-9 md:h-10 px-4 text-base gap-2 border border-aaa bg-white text-gray-700 hover:bg-theme-primary hover:text-white hover:border-theme-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="icon-trash text-base leading-none" aria-hidden="true" />
            Clear Cart
          </button>
        </div>
      </div>

      {/* Order summary sidebar */}
      <div className="w-full lg-custom:w-[380px] shrink-0">
        <div className="bg-f0f0f0  p-5 sticky top-5">
          <div className="text-xl leading-[30px] md:text-2xl font-normal uppercase mb-2.5 pb-2.5 border-b border-black">
            Order Summary
          </div>

          <div className="space-y-3 text-sm">
            {subtotal && (
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal.value, subtotal.currency)}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="italic">Calculated at checkout</span>
            </div>
          </div>

          {grandTotal && (
            <div className="flex justify-between text-lg font-bold mt-5 pt-4 border-t border-gray-200">
              <span>Grand Total</span>
              <span>{formatPrice(grandTotal.value, grandTotal.currency)}</span>
            </div>
          )}

          <Link
            href="/checkout"
            className="block w-full text-center bg-theme-primary text-white font-bold py-3.5 px-4 uppercase text-sm hover:opacity-90 transition-opacity mt-6"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
