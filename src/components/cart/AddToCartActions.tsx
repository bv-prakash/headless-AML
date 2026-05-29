"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import QuantitySelector from "@/src/components/common/controls/QuantitySelector";
import Button from "@/src/components/common/controls/Button";
import { useAddToCompare } from "@/src/hooks/useAddToCompare";
import { useAddToWishlist } from "@/src/hooks/useAddToWishlist";
import type { RequisitionListItemsInput } from "@/src/framework/graphql/requisition-lists/mutations/addProductsToRequisitionList";

/**
 * Lazy-loaded — the button pulls in Apollo queries for storeConfig + customer
 * requisition lists + the create-list modal, and is needed only on PDPs. PLP
 * cards, Related, Upsell, Cross-sell all skip `showRequisitionButton`, so
 * eager-importing would ship ~15kB they never execute.
 */
const AddToRequisitionListButton = dynamic(
  () => import("@/src/components/pdp/AddToRequisitionListButton"),
  { ssr: false },
);

type AddToCartActionsProps = {
  readonly itemKey: string;
  readonly sku: string;
  readonly productId: number;
  readonly productName: string;
  readonly isOutOfStock?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  /** Warm guest cart (createEmptyCart) on hover/focus before click — shortens loading on first add. */
  readonly onPrefetchCart?: () => void;
  readonly onAddToCart: () => void;
  readonly showQuantity?: boolean;
  /** When Redux has no qty yet (e.g. `?qty=` from edit link). */
  readonly defaultQuantity?: number;
  readonly variant?: "plp" | "pdp";
  /**
   * Show the "Add to Requisition List" icon button. Must be set explicitly by
   * the caller — relying on `variant === "pdp"` is unsafe because the PDP page
   * reuses `ProductActions` (which hard-codes `variant="plp"`) for simple/
   * virtual products. Only callers that know they're on a PDP set this.
   */
  readonly showRequisitionButton?: boolean;
  /**
   * Builds the items sent to `addProductsToRequisitionList`. PDP option
   * components use this to send the correct SKU/options shape per product type
   * (e.g. configurable must send the variant child SKU, not the parent).
   */
  readonly buildRequisitionItems?: () => ReadonlyArray<RequisitionListItemsInput> | null;
  overrideStyles?: string;
};

function AddToCartActions({
  itemKey,
  sku,
  productId,
  productName,
  isOutOfStock = false,
  disabled = false,
  loading = false,
  onPrefetchCart,
  onAddToCart,
  showQuantity = true,
  defaultQuantity,
  variant = "pdp",
  showRequisitionButton = false,
  buildRequisitionItems,
  overrideStyles,
}: AddToCartActionsProps) {
  const { execute: addToCompare, loading: compareLoading } =
    useAddToCompare(productId, productName);
  const { execute: addToWishlist, loading: wishlistLoading } =
    useAddToWishlist(sku, productName);

  const isPlp = variant === "plp";
  const btnVariant = isPlp ? "secondary" : "primary";
  const btnSize = isPlp ? "md" : "lg";

  return (
    <div
      className={`flex items-center ${isPlp ? "justify-center " : ""} gap-3 ${overrideStyles || ""}`}
    >
      {showQuantity && !isOutOfStock && (
        <QuantitySelector
          key={itemKey}
          itemKey={itemKey}
          defaultValue={defaultQuantity}
          disabled={loading || disabled}
          size="lg"
        />
      )}

      <Button
        variant={btnVariant}
        size={btnSize}
        onClick={onAddToCart}
        onPointerEnter={onPrefetchCart}
        onFocus={onPrefetchCart}
        disabled={isOutOfStock || disabled}
        loading={loading}
        loadingLabel="Adding…"
        className={
          isPlp
            ? `flex-1 w-auto${isOutOfStock ? " cursor-not-allowed!" : ""}`
            : "w-full md:w-auto"
        }
        aria-label={
          isOutOfStock
            ? `${productName} is out of stock`
            : `Add ${productName} to cart`
        }
        aria-haspopup={isOutOfStock ? undefined : "dialog"}
        title={
          isOutOfStock
            ? "Out of Stock"
            : "Add to Cart — opens the shopping cart in a dialog"
        }
      >
        {isOutOfStock && isPlp ? (
          <span className="text-light-red">Out of Stock</span>
        ) : (
          <>
            <span className={isPlp ? "hidden md:inline" : ""}>
              Add to Cart
            </span>
            <i
              className="icon-cart text-base leading-none"
              aria-hidden="true"
            />
          </>
        )}
      </Button>

      <Button
        variant="secondary"
        size="icon"
        onClick={addToCompare}
        loading={compareLoading}
        aria-label={`Add ${productName} to compare`}
        title="Add to Compare"
      >
        <i
          className="icon-compare text-base leading-none"
          aria-hidden="true"
        />
      </Button>

      <Button
        variant="secondary"
        size="icon"
        onClick={addToWishlist}
        loading={wishlistLoading}
        aria-label={`Add ${productName} to wishlist`}
        title="Add to Wishlist"
      >
        <i
          className="icon-requisition-list text-base leading-none"
          aria-hidden="true"
        />
      </Button>

      {showRequisitionButton && (
        <AddToRequisitionListButton
          itemKey={itemKey}
          sku={sku}
          productName={productName}
          disabled={disabled || isOutOfStock}
          buildItems={buildRequisitionItems}
        />
      )}
    </div>
  );
}

export default memo(AddToCartActions);
