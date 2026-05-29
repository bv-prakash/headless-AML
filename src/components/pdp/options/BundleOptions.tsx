"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { useAppSelector } from "@/src/store/hooks";
import { toast } from "react-toastify";
import { useAddToCart } from "@/src/hooks/useAddToCart";
import { formatPrice } from "@/src/utils/format";
import AddToCartActions from "@/src/components/cart/AddToCartActions";
import {
  PDP_ADD_TO_CART_WRAP_CLASS,
  PDP_OPTIONS_BLOCK_CLASS,
  PDP_OPTION_LABEL_CLASS,
  PDP_OPTION_REQUIRED_CLASS,
  PDP_OPTION_SELECT_CLASS,
  pdpChoiceChipClass,
} from "@/src/components/pdp/options/pdpAddToCartSection";
import {
  ADD_BUNDLE_TO_CART_MUTATION,
  type AddBundleToCartResponse,
  type AddBundleToCartVariables,
  type BundleOptionInput,
} from "@/src/framework/graphql/cart/mutations/addBundleToCart";
import type { BundleItem } from "@/src/framework/graphql/pdp/types";
import { encodeOptionUid } from "@/src/utils/magentoOptionUid";
import type { RequisitionListItemsInput } from "@/src/framework/graphql/requisition-lists/mutations/addProductsToRequisitionList";

type BundleOptionsProps = {
  readonly sku: string;
  readonly productId: number;
  readonly productName: string;
  readonly items: readonly BundleItem[];
  readonly initialQty?: number | null;
};

export default function BundleOptions({
  sku,
  productId,
  productName,
  items,
  initialQty = null,
}: BundleOptionsProps) {
  const quantity = useAppSelector((s) => s.cart.quantities[sku] ?? initialQty ?? 1);
  const { execute, loading, prefetchCart } = useAddToCart(productName);

  const [selections, setSelections] = useState<Record<number, number[]>>(() => {
    const initial: Record<number, number[]> = {};
    for (const item of items) {
      if (item.options.length > 0) {
        initial[item.option_id] = [item.options[0].id];
      }
    }
    return initial;
  });

  const [addBundle] = useMutation<AddBundleToCartResponse, AddBundleToCartVariables>(
    ADD_BUNDLE_TO_CART_MUTATION,
  );

  const handleSingleSelect = useCallback((optionId: number, choiceId: number) => {
    setSelections((prev) => ({ ...prev, [optionId]: [choiceId] }));
  }, []);

  const handleMultiSelect = useCallback((optionId: number, choiceId: number, checked: boolean) => {
    setSelections((prev) => {
      const current = prev[optionId] ?? [];
      return {
        ...prev,
        [optionId]: checked ? [...current, choiceId] : current.filter((id) => id !== choiceId),
      };
    });
  }, []);

  const allRequiredSelected = items.every(
    (item) => !item.required || (selections[item.option_id]?.length ?? 0) > 0,
  );

  const buildBundleOptions = useCallback((): BundleOptionInput[] => {
    return items
      .filter((item) => (selections[item.option_id]?.length ?? 0) > 0)
      .map((item) => {
        const choice = item.options.find((o) => o.id === selections[item.option_id]?.[0]);
        return {
          id: item.option_id,
          quantity: choice?.quantity ?? 1,
          value: selections[item.option_id].map(String),
        };
      });
  }, [items, selections]);

  /**
   * Magento `addProductsToRequisitionList` (unified mutation) accepts the
   * parent bundle SKU plus an array of base64-encoded option UIDs in the
   * shape `bundle/<optionId>/<selectionId>/<qty>` — same encoding the
   * storefront uses for bundle line items in the cart.
   */
  const buildRequisitionItems = useCallback((): ReadonlyArray<RequisitionListItemsInput> => {
    const uids: string[] = [];
    for (const item of items) {
      const selectedIds = selections[item.option_id] ?? [];
      for (const selId of selectedIds) {
        const choice = item.options.find((o) => o.id === selId);
        const qty = choice?.quantity ?? 1;
        uids.push(encodeOptionUid("bundle", item.option_id, selId, qty));
      }
    }
    return [{ sku, selected_options: uids }];
  }, [items, selections, sku]);

  const handleAddToCart = useCallback(() => {
    if (!allRequiredSelected) {
      toast.error("Please select all required options.");
      return;
    }

    const bundleOptions = buildBundleOptions();

    execute(async (cartId) => {
      const { data } = await addBundle({
        variables: { cartId, sku, quantity, bundleOptions },
      });
      return data?.addBundleProductsToCart?.cart;
    });
  }, [allRequiredSelected, sku, quantity, buildBundleOptions, addBundle, execute]);

  if (items.length === 0) return null;

  return (
    <>
      <div className={`bundle-options ${PDP_OPTIONS_BLOCK_CLASS}`}>
        {items.map((item) => {
          const selectedIds = selections[item.option_id] ?? [];
          const isMulti = item.type === "checkbox" || item.type === "multi";

          return (
            <div key={item.option_id} className="flex flex-col gap-2.5">
              <div className={PDP_OPTION_LABEL_CLASS}>
                {item.title}
                {item.required && <span className={PDP_OPTION_REQUIRED_CLASS}>*</span>}
              </div>

              {item.type === "select" || item.type === "drop_down" ? (
                <select
                  value={selectedIds[0] ?? ""}
                  onChange={(e) => handleSingleSelect(item.option_id, Number(e.target.value))}
                  className={PDP_OPTION_SELECT_CLASS}
                >
                  {item.options.map((choice) => {
                    const price = choice.product?.price_range?.minimum_price?.final_price;
                    return (
                      <option key={choice.id} value={choice.id}>
                        {choice.label}
                        {price?.value != null && ` — ${formatPrice(price.value, price.currency)}`}
                        {` × ${choice.quantity}`}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="flex flex-wrap gap-x-2.5 gap-y-2.5 lg-custom:gap-x-5!">
                  {item.options.map((choice) => {
                    const price = choice.product?.price_range?.minimum_price?.final_price;
                    const isChecked = selectedIds.includes(choice.id);

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          isMulti
                            ? handleMultiSelect(item.option_id, choice.id, !isChecked)
                            : handleSingleSelect(item.option_id, choice.id)
                        }
                        className={pdpChoiceChipClass(isChecked)}
                      >
                        <span className="inline-flex flex-col items-start gap-0.5 text-left">
                          <span>{choice.label}</span>
                          {price?.value != null && (
                            <span
                              className={
                                isChecked
                                  ? "text-xs font-normal text-white/90"
                                  : "text-xs font-normal text-gray-600"
                              }
                            >
                              {formatPrice(price.value, price.currency)} × {choice.quantity}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={PDP_ADD_TO_CART_WRAP_CLASS}>
        <AddToCartActions
          itemKey={sku}
          sku={sku}
          productId={productId}
          productName={productName}
          disabled={!allRequiredSelected}
          loading={loading}
          onPrefetchCart={prefetchCart}
          onAddToCart={handleAddToCart}
          defaultQuantity={initialQty ?? undefined}
          variant="plp"
          showRequisitionButton
          buildRequisitionItems={buildRequisitionItems}
        />
      </div>
    </>
  );
}
