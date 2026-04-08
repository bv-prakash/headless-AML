"use client";

import { useState, useCallback, useMemo } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppSelector } from "@/src/store/hooks";
import { useAddToCart } from "@/src/hooks/useAddToCart";
import { formatPrice } from "@/src/utils/format";
import AddToCartActions from "@/src/components/common/AddToCartActions";
import {
  ADD_CONFIGURABLE_TO_CART_MUTATION,
  type AddConfigurableToCartResponse,
  type AddConfigurableToCartVariables,
} from "@/src/framework/graphql/mutations/cartMutations";
import type {
  ConfigurableOption,
  ConfigurableVariant,
} from "@/src/framework/graphql/queries/productDetail";

type ConfigurableOptionsProps = {
  readonly parentSku: string;
  readonly productId: number;
  readonly productName: string;
  readonly options: readonly ConfigurableOption[];
  readonly variants: readonly ConfigurableVariant[];
};

export default function ConfigurableOptions({
  parentSku,
  productId,
  productName,
  options,
  variants,
}: ConfigurableOptionsProps) {
  const quantity = useAppSelector((s) => s.cart.quantities[parentSku] ?? 1);
  const { execute, loading } = useAddToCart(productName);

  const [selections, setSelections] = useState<Record<string, number>>({});

  const [addConfigurable] = useMutation<
    AddConfigurableToCartResponse,
    AddConfigurableToCartVariables
  >(ADD_CONFIGURABLE_TO_CART_MUTATION);

  const handleSelect = useCallback((code: string, valueIndex: number) => {
    setSelections((prev) => ({ ...prev, [code]: valueIndex }));
  }, []);

  const allSelected = options.every((opt) => selections[opt.attribute_code] != null);

  const matchedVariant = useMemo(() => {
    if (!allSelected) return null;
    return (
      variants.find((v) =>
        v.attributes.every(
          (attr) => selections[attr.code] === attr.value_index,
        ),
      ) ?? null
    );
  }, [allSelected, variants, selections]);

  const variantPrice = matchedVariant?.product?.price_range?.minimum_price?.final_price;
  const isVariantOOS = matchedVariant?.product.stock_status === "OUT_OF_STOCK";

  const handleAddToCart = useCallback(() => {
    if (!matchedVariant) {
      toast.error("Please select all options.");
      return;
    }
    if (isVariantOOS) {
      toast.error("This variant is out of stock.");
      return;
    }

    execute(async (cartId) => {
      const { data } = await addConfigurable({
        variables: {
          cartId,
          parentSku,
          variantSku: matchedVariant.product.sku,
          quantity,
        },
      });
      return data?.addConfigurableProductsToCart?.cart;
    });
  }, [matchedVariant, isVariantOOS, parentSku, quantity, addConfigurable, execute]);

  return (
    <div className="configurable-options flex flex-col gap-5">
      {options.map((option) => (
        <div key={option.attribute_code} className="flex flex-col gap-2">
          <label className="text-sm font-semibold uppercase text-gray-700">
            {option.label}
          </label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((val) => {
              const isSelected = selections[option.attribute_code] === val.value_index;
              return (
                <button
                  key={val.value_index}
                  type="button"
                  onClick={() => handleSelect(option.attribute_code, val.value_index)}
                  className={`px-4 py-2 text-sm border rounded-md transition-colors cursor-pointer ${
                    isSelected
                      ? "border-theme-primary bg-theme-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-theme-primary"
                  }`}
                >
                  {val.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {matchedVariant && variantPrice?.value != null && (
        <p className="text-lg font-bold text-theme-secondary">
          {formatPrice(variantPrice.value, variantPrice.currency)}
        </p>
      )}

      {isVariantOOS && (
        <p className="text-sm font-semibold text-red-600">This variant is out of stock.</p>
      )}

      <AddToCartActions
        itemKey={parentSku}
        sku={parentSku}
        productId={productId}
        productName={productName}
        isOutOfStock={isVariantOOS}
        disabled={!allSelected}
        loading={loading}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
