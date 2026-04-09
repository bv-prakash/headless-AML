"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppSelector } from "@/src/store/hooks";
import { useAddToCart } from "@/src/hooks/useAddToCart";
import AddToCartActions from "@/src/components/common/AddToCartActions";
import {
  ADD_TO_CART_MUTATION,
  ADD_VIRTUAL_TO_CART_MUTATION,
  type AddToCartResponse,
  type AddToCartVariables,
  type AddVirtualToCartResponse,
  type AddVirtualToCartVariables,
} from "@/src/framework/graphql/mutations/cartMutations";

const NEEDS_OPTIONS_TYPES = [
  "ConfigurableProduct",
  "BundleProduct",
  "DownloadableProduct",
  "GroupedProduct",
];

type ProductActionsProps = {
  readonly sku: string;
  readonly productId: number;
  readonly productName: string;
  readonly productType?: string;
  readonly stockStatus: string;
  /** PDP URL (e.g. from `url_key`). Required on PLP to send configurable/bundle products to the product page. */
  readonly productPageHref?: string;
  readonly overrideStyles?: string;
  readonly showQuantity?: boolean;
  /** From `?qty=` when opening PDP from cart/minicart edit. */
  readonly initialQty?: number;
};

export default function ProductActions({
  sku,
  productId,
  productName,
  productType,
  stockStatus,
  productPageHref,
  overrideStyles,
  showQuantity = false,
  initialQty,
}: ProductActionsProps) {
  const router = useRouter();
  const isOutOfStock = stockStatus === "OUT_OF_STOCK";
  const needsOptions = NEEDS_OPTIONS_TYPES.includes(productType ?? "");
  const isVirtual = productType === "VirtualProduct";
  const quantity = useAppSelector(
    (state) => state.cart.quantities[sku] ?? initialQty ?? 1,
  );

  const { execute, loading, prefetchCart } = useAddToCart(productName);

  const [addToCart] = useMutation<AddToCartResponse, AddToCartVariables>(
    ADD_TO_CART_MUTATION,
  );
  const [addVirtual] = useMutation<AddVirtualToCartResponse, AddVirtualToCartVariables>(
    ADD_VIRTUAL_TO_CART_MUTATION,
  );

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) return;
    if (needsOptions) {
      if (productPageHref) {
        router.push(productPageHref);
        return;
      }
      toast.info("Please select product options on the product page.");
      return;
    }

    execute(async (cartId) => {
      if (isVirtual) {
        const { data } = await addVirtual({ variables: { cartId, sku, quantity } });
        return data?.addVirtualProductsToCart?.cart;
      }
      const { data } = await addToCart({ variables: { cartId, sku, quantity } });
      return data?.addSimpleProductsToCart?.cart;
    });
  }, [
    isOutOfStock,
    needsOptions,
    isVirtual,
    sku,
    quantity,
    execute,
    addToCart,
    addVirtual,
    productPageHref,
    router,
  ]);

  return (
    <div className={overrideStyles ?? ""}>
      <AddToCartActions
        itemKey={sku}
        sku={sku}
        productId={productId}
        productName={productName}
        isOutOfStock={isOutOfStock}
        loading={loading}
        onPrefetchCart={prefetchCart}
        onAddToCart={handleAddToCart}
        showQuantity={showQuantity}
        defaultQuantity={initialQty}
        variant="plp"
      />
    </div>
  );
}
