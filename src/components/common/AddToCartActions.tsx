"use client";

import { memo } from "react";
import QuantitySelector from "@/src/components/common/QuantitySelector";
import Button from "@/src/components/common/Button";
import { useAddToCompare } from "@/src/hooks/useAddToCompare";
import { useAddToWishlist } from "@/src/hooks/useAddToWishlist";

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
    </div>
  );
}

export default memo(AddToCartActions);
