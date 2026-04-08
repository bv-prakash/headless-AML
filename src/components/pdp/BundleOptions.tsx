"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { useAppSelector } from "@/src/store/hooks";
import { toast } from "react-toastify";
import { useAddToCart } from "@/src/hooks/useAddToCart";
import { formatPrice } from "@/src/utils/format";
import AddToCartActions from "@/src/components/common/AddToCartActions";
import {
  ADD_BUNDLE_TO_CART_MUTATION,
  type AddBundleToCartResponse,
  type AddBundleToCartVariables,
  type BundleOptionInput,
} from "@/src/framework/graphql/mutations/cartMutations";
import type { BundleItem } from "@/src/framework/graphql/queries/productDetail";

type BundleOptionsProps = {
  readonly sku: string;
  readonly productId: number;
  readonly productName: string;
  readonly items: readonly BundleItem[];
};

export default function BundleOptions({ sku, productId, productName, items }: BundleOptionsProps) {
  const quantity = useAppSelector((s) => s.cart.quantities[sku] ?? 1);
  const { execute, loading } = useAddToCart(productName);

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
    <div className="bundle-options flex flex-col gap-5">
      <h3 className="text-base font-bold uppercase text-gray-800">Customize Your Bundle</h3>

      {items.map((item) => {
        const selectedIds = selections[item.option_id] ?? [];
        const isMulti = item.type === "checkbox" || item.type === "multi";

        return (
          <fieldset key={item.option_id} className="flex flex-col gap-2 border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-gray-700 px-1">
              {item.title}
              {item.required && <span className="text-red-500 ml-0.5">*</span>}
            </legend>

            {item.type === "select" || item.type === "drop_down" ? (
              <select
                value={selectedIds[0] ?? ""}
                onChange={(e) => handleSingleSelect(item.option_id, Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-theme-primary focus:outline-none"
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
              <div className="flex flex-col gap-1.5">
                {item.options.map((choice) => {
                  const price = choice.product?.price_range?.minimum_price?.final_price;
                  const isChecked = selectedIds.includes(choice.id);

                  return (
                    <label key={choice.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type={isMulti ? "checkbox" : "radio"}
                        name={`bundle-${item.option_id}`}
                        value={choice.id}
                        checked={isChecked}
                        onChange={(e) =>
                          isMulti
                            ? handleMultiSelect(item.option_id, choice.id, e.target.checked)
                            : handleSingleSelect(item.option_id, choice.id)
                        }
                      />
                      <span>
                        {choice.label}
                        {price?.value != null && (
                          <span className="text-gray-500"> — {formatPrice(price.value, price.currency)}</span>
                        )}
                        <span className="text-gray-400"> × {choice.quantity}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
        );
      })}

      <AddToCartActions
        itemKey={sku}
        sku={sku}
        productId={productId}
        productName={productName}
        disabled={!allRequiredSelected}
        loading={loading}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
