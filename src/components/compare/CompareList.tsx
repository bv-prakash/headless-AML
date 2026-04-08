"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import {
  clearCompare,
  setCompareCount,
} from "@/src/store/slices/compareSlice";
import { stripHtml } from "@/src/utils/html";
import { formatPrice } from "@/src/utils/format";
import {
  COMPARE_LIST_QUERY,
  REMOVE_FROM_COMPARE_LIST_MUTATION,
  type CompareListQueryResponse,
  type CompareListQueryVariables,
  type RemoveFromCompareListResponse,
  type RemoveFromCompareListVariables,
} from "@/src/framework/graphql/mutations/compareMutations";

export default function CompareList() {
  const dispatch = useAppDispatch();
  const compareUid = useAppSelector((state) => state.compare.uid);
  const hydrated = useAppSelector((state) => state.compare.hydrated);

  const { data, loading, error, refetch } = useQuery<
    CompareListQueryResponse,
    CompareListQueryVariables
  >(COMPARE_LIST_QUERY, {
    variables: { uid: compareUid ?? "" },
    skip: !compareUid,
    fetchPolicy: "network-only",
  });

  const [removeProducts, { loading: removing }] = useMutation<
    RemoveFromCompareListResponse,
    RemoveFromCompareListVariables
  >(REMOVE_FROM_COMPARE_LIST_MUTATION);

  const compareList = data?.compareList ?? null;

  useEffect(() => {
    if (error && compareUid) {
      dispatch(clearCompare());
    }
  }, [error, compareUid, dispatch]);

  useEffect(() => {
    if (!compareList || loading) return;
    dispatch(setCompareCount(compareList.item_count));
    if (compareList.item_count === 0 && compareUid) {
      dispatch(clearCompare());
    }
  }, [compareList, loading, compareUid, dispatch]);

  const handleRemove = useCallback(
    async (productUid: string, productName: string) => {
      if (!compareUid) return;
      try {
        const { data: removeData } = await removeProducts({
          variables: { uid: compareUid, products: [productUid] },
        });
        const newCount = removeData?.removeProductsFromCompareList?.item_count ?? 0;
        dispatch(setCompareCount(newCount));
        if (newCount === 0) {
          dispatch(clearCompare());
        }
        toast.success(`${productName} removed from compare.`);
        refetch();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to remove product.",
        );
      }
    },
    [compareUid, removeProducts, refetch, dispatch],
  );

  if (!hydrated || loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
        <div className="h-10 w-10 rounded-full border-[3px] border-gray-200 border-t-theme-primary animate-spin" />
        <span className="sr-only">Loading compare list</span>
      </div>
    );
  }

  if (!compareUid) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg">No compare list found.</p>
        <p className="mt-2 text-sm">
          Add products to compare from the product listing page.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600">
        <p>Failed to load compare list.</p>
        <p className="mt-1 text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!compareList || compareList.item_count === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg">Your compare list is empty.</p>
        <p className="mt-2 text-sm">
          Add products to compare from the product listing page.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-theme-primary underline hover:no-underline"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const { items, attributes } = compareList;

  return (
    <div className="compare-list overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-50 border border-gray-200 p-3 text-left font-semibold min-w-[140px]">
              Product
            </th>
            {items.map((item) => (
              <th
                key={item.uid}
                className="border border-gray-200 p-3 text-center min-w-[200px] align-top bg-white"
              >
                <div className="flex flex-col items-center gap-2">
                  {item.product.small_image?.url && (
                    <Link href={`/${item.product.url_key ?? ""}`}>
                      <Image
                        src={item.product.small_image.url}
                        alt={item.product.name}
                        width={120}
                        height={120}
                        className="object-contain"
                      />
                    </Link>
                  )}
                  <Link
                    href={`/${item.product.url_key ?? ""}`}
                    className="font-bold text-black hover:text-theme-primary transition-colors"
                  >
                    {item.product.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      handleRemove(item.uid, item.product.name)
                    }
                    disabled={removing}
                    className="text-xs text-red-600 hover:text-red-800 underline cursor-pointer disabled:opacity-50"
                    aria-label={`Remove ${item.product.name} from compare`}
                  >
                    <i className="icon-trash text-sm mr-1" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="sticky left-0 z-10 bg-gray-50 border border-gray-200 p-3 font-semibold">
              SKU
            </td>
            {items.map((item) => (
              <td key={item.uid} className="border border-gray-200 p-3 text-center">
                {item.product.sku}
              </td>
            ))}
          </tr>

          <tr>
            <td className="sticky left-0 z-10 bg-gray-50 border border-gray-200 p-3 font-semibold">
              Price
            </td>
            {items.map((item) => {
              const price = item.product.price_range?.minimum_price?.regular_price;
              return (
                <td key={item.uid} className="border border-gray-200 p-3 text-center font-bold">
                  {formatPrice(price?.value, price?.currency)}
                </td>
              );
            })}
          </tr>

          <tr>
            <td className="sticky left-0 z-10 bg-gray-50 border border-gray-200 p-3 font-semibold">
              Description
            </td>
            {items.map((item) => {
              const plain = item.product.description?.html
                ? stripHtml(item.product.description.html)
                : "";
              return (
              <td key={item.uid} className="border border-gray-200 p-3 text-left text-xs leading-relaxed">
                {plain
                  ? plain.slice(0, 200) + (plain.length > 200 ? "…" : "")
                  : "—"}
              </td>
              );
            })}
          </tr>

          {attributes.map((attr) => (
            <tr key={attr.code}>
              <td className="sticky left-0 z-10 bg-gray-50 border border-gray-200 p-3 font-semibold">
                {attr.label}
              </td>
              {items.map((item) => {
                const product = item.product as Record<string, unknown>;
                const val = product[attr.code];
                const display =
                  val == null
                    ? "—"
                    : typeof val === "object" && val !== null && "html" in val
                      ? stripHtml((val as { html: string }).html)
                      : String(val);

                return (
                  <td key={item.uid} className="border border-gray-200 p-3 text-center">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
