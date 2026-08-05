export type CustomerWishlistItemRow = {
  readonly id: string;
  readonly quantity: number;
  readonly product: {
    readonly __typename?: string | null;
    readonly uid?: string | null;
    readonly sku: string;
    readonly name: string;
    readonly url_key?: string | null;
    readonly small_image?: { readonly url?: string | null } | null;
    readonly price_range?: {
      readonly minimum_price: {
        readonly regular_price: { readonly value: number; readonly currency: string };
      };
    } | null;
  } | null;
};

/** Deprecated `Wishlist.items` row shape (`qty` instead of `quantity`). */
export type LegacyWishlistItemRow = {
  readonly id: number | string;
  readonly qty?: number | null;
  readonly product: CustomerWishlistItemRow["product"];
};

export type WishlistData = {
  readonly id: string;
  readonly items_count: number;
  readonly items_v2?: {
    items: readonly CustomerWishlistItemRow[];
  };
  readonly items?: readonly LegacyWishlistItemRow[] | null;
};

export type CustomerWishlistResponse = {
  customer: {
    id?: number | null;
    wishlist?: WishlistData | null;
    wishlists?: readonly WishlistData[];
  } | null;
};
