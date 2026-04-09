import type { RootState } from "@/src/store/store";

/**
 * Resolves quantity for QuantitySelector `itemKey`:
 * 1) `state.cart.quantities[itemKey]` (synced from `setCart`)
 * 2) Cart API line: `cart-${uid}` → match `item.uid`
 * 3) Cart API line(s): product `sku` → sum line qty (matches `setCart` sku aggregation)
 */
export function getResolvedCartQuantity(
  state: RootState,
  itemKey: string,
): number | undefined {
  const q = state.cart.quantities[itemKey];
  if (q !== undefined && q !== null) return q;

  const items = state.cart.cart?.items;
  if (!items?.length) return undefined;

  if (itemKey.startsWith("cart-")) {
    const uid = itemKey.slice("cart-".length);
    const line = items.find((i) => String(i.uid) === String(uid));
    if (line) return line.quantity;
  }

  const bySku = items.filter(
    (i) => i.product?.sku != null && String(i.product.sku) === String(itemKey),
  );
  if (bySku.length > 0) {
    return bySku.reduce((sum, i) => sum + i.quantity, 0);
  }

  return undefined;
}
