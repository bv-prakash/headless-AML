import type {
  CustomerWishlistItemRow,
  CustomerWishlistResponse,
  WishlistData,
} from "@/src/framework/graphql/wishlist/types";

/** Prefer default wishlist; fall back to first `wishlists` entry (Adobe Commerce / multi-list). */
export function getActiveWishlist(
  data: CustomerWishlistResponse | undefined,
): WishlistData | undefined {
  const c = data?.customer;
  if (!c) return undefined;
  if (c.wishlist?.id != null) return c.wishlist;
  const first = c.wishlists?.[0];
  if (first?.id != null) return first;
  return undefined;
}

/** Normalize `items_v2` and/or legacy `items` into a single list for the UI. */
export function normalizeWishlistItemRows(
  wishlist: WishlistData | undefined,
): CustomerWishlistItemRow[] {
  if (!wishlist) return [];
  const v2 = wishlist.items_v2?.items?.filter(Boolean) ?? [];
  if (v2.length > 0) {
    return v2.map((row) => ({
      ...row,
      id: String(row.id),
      quantity: Number(row.quantity),
    }));
  }
  const legacy = wishlist.items?.filter(Boolean) ?? [];
  return legacy.map((row) => ({
    id: String(row.id),
    quantity: Math.max(1, Number(row.qty ?? 1)),
    product: row.product,
  }));
}
