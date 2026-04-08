"use client";

import { useState, useCallback, useMemo } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAddToCart } from "@/src/hooks/useAddToCart";
import { formatPrice } from "@/src/utils/format";
import AddToCartActions from "@/src/components/common/AddToCartActions";
import {
  ADD_GROUPED_TO_CART_MUTATION,
  type AddGroupedToCartResponse,
  type AddGroupedToCartVariables,
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
  const { execute, loading } = useAddToCart(productName);

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
    <div className="grouped-product-table flex flex-col gap-4">
      <h3 className="text-base font-bold uppercase text-gray-800">Products in this Group</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 pr-4 font-semibold text-gray-600">Product</th>
              <th className="text-left py-2 pr-4 font-semibold text-gray-600">SKU</th>
              <th className="text-right py-2 pr-4 font-semibold text-gray-600">Price</th>
              <th className="text-center py-2 pr-4 font-semibold text-gray-600">Qty</th>
              <th className="text-center py-2 font-semibold text-gray-600">Availability</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => {
              const price = item.product.price_range?.minimum_price?.final_price;
              const isOutOfStock = item.product.stock_status === "OUT_OF_STOCK";

              return (
                <tr key={item.product.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-800">
                    {item.product.name}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">
                    {item.product.sku}
                  </td>
                  <td className="py-3 pr-4 text-right font-semibold text-theme-secondary">
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
                      className="w-16 border border-gray-300 rounded-md px-2 py-1 text-center text-sm focus:border-theme-primary focus:outline-none disabled:opacity-50"
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

      <AddToCartActions
        itemKey={sku}
        sku={sku}
        productId={productId}
        productName={productName}
        disabled={selectedItems.length === 0}
        loading={loading}
        onAddToCart={handleAddToCart}
        showQuantity={false}
      />
    </div>
  );
}
