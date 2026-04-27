"use client";

import { useState, useCallback, useMemo } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAddToCart } from "@/src/hooks/useAddToCart";
import { formatPrice } from "@/src/utils/format";
import AddToCartActions from "@/src/components/common/AddToCartActions";
import {
  PDP_ADD_TO_CART_WRAP_CLASS,
  PDP_OPTIONS_BLOCK_CLASS,
  PDP_OPTION_LABEL_CLASS,
} from "@/src/components/pdp/pdpAddToCartSection";
import { ADD_GROUPED_TO_CART_MUTATION } from "@/src/framework/graphql/mutations/cartMutations";
import type {
  AddGroupedToCartResponse,
  AddGroupedToCartVariables,
} from "@/src/framework/graphql/mutations/cartMutations";
import type { GroupedProductItem } from "@/src/framework/graphql/queries/productDetail";

type GroupedProductTableProps = {
  readonly sku: string;
  readonly productId: number;
  readonly productName: string;
  readonly items: readonly GroupedProductItem[];
};

export default function GroupedProductTable({ sku, productId, productName, items }: GroupedProductTableProps) {
  const sorted = useMemo(() => [...items].sort((a, b) => a.position - b.position), [items]);
  const { execute, loading, prefetchCart } = useAddToCart(productName);

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const item of sorted) {
      init[item.product.sku] = item.qty > 0 ? item.qty : 0;
    }
    return init;
  });

  const [addGrouped] = useMutation<AddGroupedToCartResponse, AddGroupedToCartVariables>(
    ADD_GROUPED_TO_CART_MUTATION,
  );

  const handleQtyChange = useCallback((itemSku: string, value: string) => {
    const n = parseInt(value, 10);
    setQuantities((prev) => ({ ...prev, [itemSku]: isNaN(n) || n < 0 ? 0 : n }));
  }, []);

  const selectedItems = useMemo(
    () => sorted.filter(
      (item) =>
        (quantities[item.product.sku] ?? 0) > 0 &&
        item.product.stock_status !== "OUT_OF_STOCK",
    ),
    [sorted, quantities],
  );

  const handleAddToCart = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.error("Please specify the quantity for at least one product.");
      return;
    }

    const cartItems = selectedItems.map((item) => ({
      data: { sku: item.product.sku, quantity: quantities[item.product.sku] },
    }));

    execute(async (cartId) => {
      const { data } = await addGrouped({ variables: { cartId, cartItems } });
      return data?.addSimpleProductsToCart?.cart;
    });
  }, [selectedItems, quantities, addGrouped, execute]);

  if (items.length === 0) return null;

  return (
    <>
      <div className={`grouped-product-table ${PDP_OPTIONS_BLOCK_CLASS}`}>
        <div className={PDP_OPTION_LABEL_CLASS}>Products in this Group</div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-aaa">
                <th className="text-left py-2 pr-4 font-bold uppercase text-black">Product</th>
                <th className="text-left py-2 pr-4 font-bold uppercase text-black">SKU</th>
                <th className="text-right py-2 pr-4 font-bold uppercase text-black">Price</th>
                <th className="text-center py-2 pr-4 font-bold uppercase text-black">Qty</th>
                <th className="text-center py-2 font-bold uppercase text-black">Availability</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => {
                const price = item.product.price_range?.minimum_price?.final_price;
                const isOutOfStock = item.product.stock_status === "OUT_OF_STOCK";

                return (
                  <tr key={item.product.id} className="border-b border-gray-200">
                    <td className="py-3 pr-4 font-medium text-black">
                      {item.product.name}
                    </td>
                    <td className="py-3 pr-4 text-black/70">
                      {item.product.sku}
                    </td>
                    <td className="py-3 pr-4 text-right font-bold text-theme-secondary">
                      {price?.value != null
                        ? formatPrice(price.value, price.currency)
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <input
                        type="number"
                        min={0}
                        value={quantities[item.product.sku] ?? 0}
                        onChange={(e) => handleQtyChange(item.product.sku, e.target.value)}
                        disabled={isOutOfStock || loading}
                        className="w-16 border border-black bg-white px-2 py-2 text-center text-sm text-black focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary disabled:opacity-50"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                          isOutOfStock
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isOutOfStock ? "Out of Stock" : "In Stock"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={PDP_ADD_TO_CART_WRAP_CLASS}>
        <AddToCartActions
          itemKey={sku}
          sku={sku}
          productId={productId}
          productName={productName}
          disabled={selectedItems.length === 0}
          loading={loading}
          onPrefetchCart={prefetchCart}
          onAddToCart={handleAddToCart}
          showQuantity={false}
          variant="plp"
        />
      </div>
    </>
  );
}
