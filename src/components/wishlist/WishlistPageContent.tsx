"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/src/store/hooks";
import type { AppDispatch } from "@/src/store/store";
import { openMinicart, setCart } from "@/src/store/slices/cartSlice";
import { setWishlistCount } from "@/src/store/slices/wishlistSlice";
import apolloClient from "@/src/framework/graphql/apolloClient";
import { getErrorMessage } from "@/src/utils/errors";
import {
  ADD_WISHLIST_ITEMS_TO_CART_MUTATION,
  CLEAR_WISHLIST_MUTATION,
  CUSTOMER_WISHLIST_QUERY,
  REMOVE_PRODUCTS_FROM_WISHLIST_MUTATION,
  UPDATE_WISHLIST_ITEMS_MUTATION,
  getActiveWishlist,
  normalizeWishlistItemRows,
  type AddWishlistItemsToCartResponse,
  type AddWishlistItemsToCartVariables,
  type ClearWishlistResponse,
  type ClearWishlistVariables,
  type CustomerWishlistItemRow,
  type CustomerWishlistResponse,
  type RemoveProductsFromWishlistResponse,
  type RemoveProductsFromWishlistVariables,
  type UpdateProductsInWishlistResponse,
  type UpdateProductsInWishlistVariables,
} from "@/src/framework/graphql/mutations/wishlistMutations";
import { CUSTOMER_CART_QUERY, type CustomerCartQueryResponse } from "@/src/framework/graphql/mutations/cartMutations";
import PageLoader from "@/src/components/common/PageLoader";

const BTN_PRIMARY =
  "inline-flex items-center justify-center py-2 px-4 text-sm font-bold uppercase bg-theme-primary text-white border-0 cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_SECONDARY =
  "inline-flex items-center justify-center py-2 px-4 text-sm font-semibold uppercase border border-ccc bg-white text-black cursor-pointer hover:border-theme-primary hover:text-theme-primary disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_DANGER =
  "inline-flex items-center justify-center py-2 px-4 text-sm font-semibold text-light-red border border-light-red bg-white cursor-pointer hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed";

function formatPrice(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

async function refreshCustomerCart(dispatch: AppDispatch) {
  const { data } = await apolloClient.query<CustomerCartQueryResponse>({
    query: CUSTOMER_CART_QUERY,
    fetchPolicy: "network-only",
  });
  if (data?.customerCart) {
    dispatch(setCart(data.customerCart));
  }
}

function syncWishlistCountFromData(dispatch: AppDispatch, data: CustomerWishlistResponse | undefined) {
  const wl = getActiveWishlist(data);
  const count = wl?.items_count;
  if (count != null) {
    dispatch(setWishlistCount(count));
  }
}

export function WishlistPageContent() {
  const dispatch = useAppDispatch();
  const { data, loading, error, refetch } = useQuery<CustomerWishlistResponse>(CUSTOMER_WISHLIST_QUERY, {
    fetchPolicy: "network-only",
  });

  const wishlist = useMemo(() => getActiveWishlist(data), [data]);
  const wishlistId = wishlist?.id ?? "0";
  const items = useMemo(() => normalizeWishlistItemRows(wishlist), [wishlist]);

  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error, "Could not load your wishlist."));
    }
  }, [error]);

  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const row of items) {
      next[row.id] = String(row.quantity);
    }
    setQtyDraft(next);
  }, [items]);

  useEffect(() => {
    syncWishlistCountFromData(dispatch, data);
  }, [data, dispatch]);

  const [removeItems] = useMutation<
    RemoveProductsFromWishlistResponse,
    RemoveProductsFromWishlistVariables
  >(REMOVE_PRODUCTS_FROM_WISHLIST_MUTATION);

  const [updateItems] = useMutation<
    UpdateProductsInWishlistResponse,
    UpdateProductsInWishlistVariables
  >(UPDATE_WISHLIST_ITEMS_MUTATION);

  const [clearWishlistMut, { loading: clearLoading }] = useMutation<
    ClearWishlistResponse,
    ClearWishlistVariables
  >(CLEAR_WISHLIST_MUTATION);

  const [addWishlistToCart, { loading: addCartLoading }] = useMutation<
    AddWishlistItemsToCartResponse,
    AddWishlistItemsToCartVariables
  >(ADD_WISHLIST_ITEMS_TO_CART_MUTATION);

  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const applyWishlistUserErrors = useCallback(
    (errors: readonly { message: string }[] | null | undefined) => {
      if (errors?.length) {
        toast.error(errors.map((e) => e.message).join(" "));
        return true;
      }
      return false;
    },
    [],
  );

  const handleDelete = useCallback(
    async (itemId: string) => {
      setBusyRowId(itemId);
      try {
        const { data: res } = await removeItems({
          variables: { wishlistId, wishlistItemsIds: [itemId] },
        });
        if (applyWishlistUserErrors(res?.removeProductsFromWishlist?.user_errors)) return;
        await refetch();
        toast.success("Removed from wishlist.");
      } catch (err) {
        toast.error(getErrorMessage(err, "Could not remove item."));
      } finally {
        setBusyRowId(null);
      }
    },
    [wishlistId, removeItems, refetch, applyWishlistUserErrors],
  );

  const handleUpdateQty = useCallback(
    async (itemId: string) => {
      const raw = qtyDraft[itemId];
      const qty = Math.floor(Number(raw));
      if (!Number.isFinite(qty) || qty < 1) {
        toast.error("Enter a quantity of at least 1.");
        return;
      }
      setBusyRowId(itemId);
      try {
        const { data: res } = await updateItems({
          variables: {
            wishlistId,
            wishlistItems: [{ wishlist_item_id: itemId, quantity: qty }],
          },
        });
        if (applyWishlistUserErrors(res?.updateProductsInWishlist?.user_errors)) return;
        await refetch();
        toast.success("Quantity updated.");
      } catch (err) {
        toast.error(getErrorMessage(err, "Could not update quantity."));
      } finally {
        setBusyRowId(null);
      }
    },
    [qtyDraft, wishlistId, updateItems, refetch, applyWishlistUserErrors],
  );

  const handleAddLineToCart = useCallback(
    async (itemId: string) => {
      setBusyRowId(itemId);
      try {
        const { data: res } = await addWishlistToCart({
          variables: { wishlistId, wishlistItemIds: [itemId] },
        });
        const errs = res?.addWishlistItemsToCart?.add_wishlist_items_to_cart_user_errors;
        if (errs?.length) {
          toast.error(errs.map((e) => e.message).join(" "));
          return;
        }
        if (!res?.addWishlistItemsToCart?.status) {
          toast.error("Could not add this item to your cart.");
          return;
        }
        await refetch();
        await refreshCustomerCart(dispatch);
        dispatch(openMinicart());
        toast.success("Added to cart.");
      } catch (err) {
        toast.error(getErrorMessage(err, "Could not add to cart."));
      } finally {
        setBusyRowId(null);
      }
    },
    [addWishlistToCart, wishlistId, refetch, dispatch],
  );

  const handleAddAllToCart = useCallback(async () => {
    if (items.length === 0) return;
    setBusyRowId("__all__");
    try {
        const { data: res } = await addWishlistToCart({
          variables: { wishlistId },
        });
      const errs = res?.addWishlistItemsToCart?.add_wishlist_items_to_cart_user_errors;
      if (errs?.length) {
        toast.error(errs.map((e) => e.message).join(" "));
      } else if (!res?.addWishlistItemsToCart?.status) {
        toast.error("Could not add wishlist items to your cart.");
      } else {
        toast.success("Wishlist items added to your cart.");
      }
      await refetch();
      await refreshCustomerCart(dispatch);
      dispatch(openMinicart());
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not add wishlist to cart."));
    } finally {
      setBusyRowId(null);
    }
  }, [addWishlistToCart, wishlistId, items.length, refetch, dispatch]);

  const handleClearWishlist = useCallback(async () => {
    if (items.length === 0) return;
    if (!globalThis.confirm("Remove all items from your wishlist?")) return;
    setBusyRowId("__clear__");
    try {
      const { data: res } = await clearWishlistMut({
        variables: { wishlistId },
      });
      if (applyWishlistUserErrors(res?.clearWishlist?.user_errors)) return;
      await refetch();
      toast.success("Wishlist cleared.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not clear wishlist."));
    } finally {
      setBusyRowId(null);
    }
  }, [clearWishlistMut, wishlistId, items.length, refetch, applyWishlistUserErrors]);

  if (loading && !wishlist) {
    return <PageLoader label="Loading wishlist…" minHeightClassName="min-h-[40vh]" />;
  }

  if (error && !wishlist) {
    return (
      <div className="space-y-3">
        <p className="text-light-red" role="alert">
          {getErrorMessage(error, "Could not load your wishlist.")}
        </p>
        <button type="button" className={BTN_SECONDARY} onClick={() => void refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const topActionsBusy = busyRowId != null || addCartLoading || clearLoading;

  return (
    <div className="space-y-6">
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <p className="text-sm text-gray-700 m-0">
            {wishlist?.items_count ?? items.length}{" "}
            {wishlist?.items_count === 1 ? "item" : "items"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BTN_PRIMARY}
              disabled={topActionsBusy}
              onClick={() => void handleAddAllToCart()}
            >
              Add all to cart
            </button>
            <button
              type="button"
              className={BTN_DANGER}
              disabled={topActionsBusy}
              onClick={() => void handleClearWishlist()}
            >
              Clear wishlist
            </button>
          </div>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="text-gray-700">Your wishlist is empty.</p>
      ) : (
        <div className="overflow-x-auto border border-aaa">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-f0f0f0 border-b-2 border-aaa text-left">
                <th className="p-3 font-bold uppercase w-[100px]">Image</th>
                <th className="p-3 font-bold uppercase">Product</th>
                <th className="p-3 font-bold uppercase w-[120px]">Price</th>
                <th className="p-3 font-bold uppercase w-[140px] text-center">Qty</th>
                <th className="p-3 font-bold uppercase text-center w-[280px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row: CustomerWishlistItemRow) => {
                const p = row.product;
                const imgUrl = p?.small_image?.url ?? null;
                const price = p?.price_range?.minimum_price?.regular_price;
                const rowBusy =
                  busyRowId === row.id || busyRowId === "__all__" || busyRowId === "__clear__";

                return (
                  <tr key={row.id} className="border-b border-ccc hover:bg-f4f4f4 align-top">
                    <td className="p-3">
                      {imgUrl ? (
                        p?.url_key ? (
                          <Link
                            href={`/${p.url_key}`}
                            className="relative block w-16 h-16 bg-white border border-ccc"
                          >
                            <Image
                              src={imgUrl}
                              alt={p?.name ?? ""}
                              fill
                              className="object-contain p-1"
                              sizes="64px"
                            />
                          </Link>
                        ) : (
                          <span className="relative block w-16 h-16 bg-white border border-ccc">
                            <Image
                              src={imgUrl}
                              alt={p?.name ?? ""}
                              fill
                              className="object-contain p-1"
                              sizes="64px"
                            />
                          </span>
                        )
                      ) : (
                        <span className="inline-flex w-16 h-16 items-center justify-center bg-f4f4f4 text-xs text-gray-500 border border-ccc">
                          —
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {p?.url_key ? (
                        <Link
                          href={`/${p.url_key}`}
                          className="text-theme-primary font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{p?.name ?? "—"}</span>
                      )}
                      {p?.sku ? (
                        <p className="text-xs text-gray-600 mt-1 m-0">SKU: {p.sku}</p>
                      ) : null}
                      {p?.__typename &&
                      p.__typename !== "SimpleProduct" &&
                      p.__typename !== "VirtualProduct" ? (
                        <p className="text-xs text-gray-600 mt-1 m-0">
                          Options may be required — use the product page if add to cart fails.
                        </p>
                      ) : null}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {price
                        ? formatPrice(price.value, price.currency)
                        : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className="w-20 h-10 px-2 border border-ccc text-center"
                          aria-label={`Quantity for ${p?.name ?? "item"}`}
                          value={qtyDraft[row.id] ?? ""}
                          disabled={rowBusy}
                          onChange={(e) =>
                            setQtyDraft((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          className={BTN_SECONDARY}
                          disabled={rowBusy}
                          onClick={() => void handleUpdateQty(row.id)}
                        >
                          Update
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          type="button"
                          className={BTN_PRIMARY}
                          disabled={rowBusy}
                          onClick={() => void handleAddLineToCart(row.id)}
                        >
                          Add to cart
                        </button>
                        <button
                          type="button"
                          className={BTN_DANGER}
                          disabled={rowBusy}
                          onClick={() => void handleDelete(row.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
