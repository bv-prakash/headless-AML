"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { getResolvedCartQuantity } from "@/src/store/cartQuantity";
import { updateConfigurableSelections } from "@/src/store/slices/configurableProductSlice";
import { useAddToCart } from "@/src/hooks/useAddToCart";
import { formatPrice } from "@/src/utils/format";
import AddToCartActions from "@/src/components/common/AddToCartActions";
import {
  PDP_ADD_TO_CART_WRAP_CLASS,
  PDP_OPTIONS_BLOCK_CLASS,
  PDP_OPTION_LABEL_CLASS,
  PDP_OPTION_REQUIRED_CLASS,
  pdpChoiceChipClass,
} from "@/src/components/pdp/pdpAddToCartSection";
import {
  ADD_CONFIGURABLE_TO_CART_MUTATION,
  type AddConfigurableToCartResponse,
  type AddConfigurableToCartVariables,
} from "@/src/framework/graphql/mutations/cartMutations";
import type {
  ConfigurableOption,
  ConfigurableVariant,
} from "@/src/framework/graphql/queries/productDetail";
import {
  deriveSelectionsFromConfigurableStoreRow,
  findConfigurableVariantBySku,
  findMatchingVariant,
  buildOptionSelectionsFromVariant,
} from "@/src/utils/configurableSelections";
function safeDomFragmentId(...parts: string[]): string {
  const raw = parts
    .join("-")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return raw.length > 0 ? raw : "pdp-opt";
}

type ConfigurableOptionsProps = {
  readonly parentSku: string;
  readonly productId: number;
  readonly productName: string;
  readonly productUrlKey: string;
  readonly options: readonly ConfigurableOption[];
  readonly variants: readonly ConfigurableVariant[];
  readonly initialVariantSku?: string | null;
  readonly initialQty?: number | null;
};

export default function ConfigurableOptions({
  parentSku,
  productId,
  productName,
  productUrlKey,
  options,
  variants,
  initialVariantSku = null,
  initialQty = null,
}: ConfigurableOptionsProps) {
  const dispatch = useAppDispatch();
  const { execute, loading, prefetchCart } = useAddToCart(productName);

  const row = useAppSelector(
    (s) => s.configurableProduct.byUrlKey[productUrlKey],
  );

  /** Derived globally from RTK + cart sync + optional ?sku= bootstrap below. */
  const selections = useMemo(
    () => deriveSelectionsFromConfigurableStoreRow(row, variants, options),
    [row, variants, options],
  );

  /**
   * Prefer `?sku=` / server `initialVariantSku` (edit-from-cart) over stale RTK/cart-derived swatches.
   * Also fills incomplete maps when only cart labels exist.
   */
  useEffect(() => {
    const r = row;
    const derived = deriveSelectionsFromConfigurableStoreRow(r, variants, options);
    const complete = options.every((o) => derived[o.attribute_code] != null);

    const skuFromUrl = initialVariantSku?.trim() || null;

    if (skuFromUrl) {
      const v = findConfigurableVariantBySku(variants, skuFromUrl);
      if (!v) return;

      const matchedFromDerived = findMatchingVariant(variants, options, derived);
      const derivedSku =
        matchedFromDerived?.product.sku ?? r?.variantSku ?? null;
      const sameVariant =
        derivedSku != null &&
        derivedSku.trim().toLowerCase() === v.product.sku.trim().toLowerCase();

      if (!complete || !sameVariant) {
        const sel = buildOptionSelectionsFromVariant(v, options);
        if (Object.keys(sel).length === 0) return;
        dispatch(
          updateConfigurableSelections({
            urlKey: productUrlKey,
            variantSku: v.product.sku,
            selections: sel,
          }),
        );
      }
      return;
    }

    if (complete) return;

    const sku = r?.variantSku?.trim() ?? null;
    if (!sku) return;

    const v = findConfigurableVariantBySku(variants, sku);
    if (!v) return;
    const sel = buildOptionSelectionsFromVariant(v, options);
    if (Object.keys(sel).length === 0) return;

    dispatch(
      updateConfigurableSelections({
        urlKey: productUrlKey,
        variantSku: v.product.sku,
        selections: sel,
      }),
    );
  }, [
    productUrlKey,
    variants,
    options,
    initialVariantSku,
    dispatch,
    row,
  ]);

  const effectiveVariantSku =
    initialVariantSku?.trim() || row?.variantSku || null;
  const effectiveQty =
    initialQty != null && Number.isFinite(initialQty) && initialQty > 0
      ? initialQty
      : null;

  const [addConfigurable] = useMutation<
    AddConfigurableToCartResponse,
    AddConfigurableToCartVariables
  >(ADD_CONFIGURABLE_TO_CART_MUTATION);

  const handleSelect = useCallback(
    (code: string, valueIndex: number) => {
      const next = { ...selections, [code]: Number(valueIndex) };
      const matched = findMatchingVariant(variants, options, next);
      dispatch(
        updateConfigurableSelections({
          urlKey: productUrlKey,
          variantSku: matched?.product.sku ?? row?.variantSku ?? parentSku,
          selections: next,
        }),
      );
    },
    [
      selections,
      variants,
      options,
      dispatch,
      productUrlKey,
      row?.variantSku,
      parentSku,
    ],
  );

  const allSelected = options.every((opt) => selections[opt.attribute_code] != null);

  const matchedVariant = useMemo(
    () => findMatchingVariant(variants, options, selections),
    [variants, options, selections],
  );

  const matchedVariantSku = matchedVariant?.product.sku ?? null;
  const qtyItemKey =
    matchedVariantSku ?? effectiveVariantSku ?? parentSku;

  const quantity = useAppSelector((s) => {
    const resolved = getResolvedCartQuantity(s, qtyItemKey);
    if (resolved != null) return resolved;
    if (matchedVariantSku && productUrlKey && s.cart.cart?.items) {
      const line = s.cart.cart.items.find(
        (i) =>
          i.product?.url_key === productUrlKey &&
          i.product?.sku === matchedVariantSku,
      );
      if (line) return line.quantity;
    }
    if (
      effectiveQty != null &&
      (qtyItemKey === effectiveVariantSku || qtyItemKey === matchedVariantSku)
    ) {
      return effectiveQty;
    }
    return 1;
  });

  const variantPrice = matchedVariant?.product?.price_range?.minimum_price?.final_price;
  const isVariantOOS = matchedVariant?.product.stock_status === "OUT_OF_STOCK";

  /**
   * Builds the per-variant payload for `addProductsToRequisitionList`.
   * Stable across renders (only depends on the chosen options/values) so the
   * memoised `AddToCartActions` doesn't churn on every parent re-render.
   * Magento needs `selected_options` UIDs — the parent SKU alone 500s with
   * "You need to choose options for your item."
   */
  const buildRequisitionItems = useCallback(() => {
    if (!allSelected) return null;
    const selectedOptionUids: string[] = [];
    for (const opt of options) {
      const chosenIndex = selections[opt.attribute_code];
      if (chosenIndex == null) continue;
      const v = opt.values.find(
        (x) => Number(x.value_index) === Number(chosenIndex),
      );
      if (v?.uid) selectedOptionUids.push(v.uid);
    }
    return [{ sku: parentSku, selected_options: selectedOptionUids }];
  }, [allSelected, options, selections, parentSku]);

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
    <>
      <div className={`configurable-options ${PDP_OPTIONS_BLOCK_CLASS}`}>
        {options.map((option) => {
          const headingId = safeDomFragmentId(
            "pdp-opt",
            productUrlKey,
            option.attribute_code,
          );
          return (
            <div key={option.attribute_code} className="flex flex-col gap-2.5">
              <p id={headingId} className={PDP_OPTION_LABEL_CLASS}>
                {option.label}
                <span className={PDP_OPTION_REQUIRED_CLASS} aria-hidden>
                  *
                </span>
              </p>
              <div
                role="group"
                aria-labelledby={headingId}
                className="flex flex-wrap gap-x-2.5 gap-y-2.5 lg-custom:gap-x-5!"
              >
                {option.values.map((val) => {
                  const sel = selections[option.attribute_code];
                  const isSelected =
                    sel != null && Number(sel) === Number(val.value_index);
                  return (
                    <button
                      key={val.value_index}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelect(option.attribute_code, val.value_index)}
                      className={pdpChoiceChipClass(isSelected)}
                    >
                      {val.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {matchedVariant && variantPrice?.value != null && (
          <p className="text-lg font-bold text-theme-secondary">
            {formatPrice(variantPrice.value, variantPrice.currency)}
          </p>
        )}

        {isVariantOOS && (
          <p className="text-sm font-semibold text-red-600">This variant is out of stock.</p>
        )}
      </div>
      <div className={PDP_ADD_TO_CART_WRAP_CLASS}>
        <AddToCartActions
          itemKey={qtyItemKey}
          sku={parentSku}
          productId={productId}
          productName={productName}
          isOutOfStock={isVariantOOS}
          disabled={!allSelected}
          loading={loading}
          onPrefetchCart={prefetchCart}
          onAddToCart={handleAddToCart}
          defaultQuantity={quantity}
          variant="plp"
          showRequisitionButton
          buildRequisitionItems={buildRequisitionItems}
        />
      </div>
    </>
  );
}
