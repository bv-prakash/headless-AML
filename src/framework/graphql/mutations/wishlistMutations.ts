import { gql } from "@apollo/client";

/** Shared product fields for wishlist lines (ProductInterface). `uid` required for Apollo `SimpleProduct` keyFields. */
const WISHLIST_PRODUCT_FIELDS = `
  __typename
  uid
  sku
  name
  url_key
  small_image {
    url
  }
  price_range {
    minimum_price {
      regular_price {
        value
        currency
      }
    }
  }
`;

/**
 * Lines from `items_v2` (preferred) plus legacy `items` (uses `qty`).
 * Some stores/API versions return an empty `items_v2.items` array while `items` is populated.
 */
const WISHLIST_LIST_BODY = `
  id
  items_count
  items_v2(pageSize: 100, currentPage: 1) {
    items {
      id
      quantity
      product {
        ${WISHLIST_PRODUCT_FIELDS}
      }
    }
  }
  items {
    id
    qty
    product {
      ${WISHLIST_PRODUCT_FIELDS}
    }
  }
`;

export const CUSTOMER_WISHLIST_QUERY = gql`
  query CustomerWishlist {
    customer {
      id
      wishlist {
        ${WISHLIST_LIST_BODY}
      }
      wishlists(pageSize: 1, currentPage: 1) {
        ${WISHLIST_LIST_BODY}
      }
    }
  }
`;

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
export function normalizeWishlistItemRows(wishlist: WishlistData | undefined): CustomerWishlistItemRow[] {
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

export const ADD_TO_WISHLIST_MUTATION = gql`
  mutation AddToWishlist(
    $wishlistId: ID!
    $wishlistItems: [WishlistItemInput!]!
  ) {
    addProductsToWishlist(
      wishlistId: $wishlistId
      wishlistItems: $wishlistItems
    ) {
      wishlist {
        id
        items_count
      }
      user_errors {
        code
        message
      }
    }
  }
`;

export type WishlistItemInput = {
  readonly sku: string;
  readonly quantity: number;
  readonly parent_sku?: string;
  readonly selected_options?: readonly string[];
};

export type AddToWishlistVariables = {
  readonly wishlistId: string;
  readonly wishlistItems: readonly WishlistItemInput[];
};

export type AddToWishlistResponse = {
  addProductsToWishlist: {
    wishlist: {
      id: string;
      items_count: number;
    };
    user_errors: readonly {
      code: string;
      message: string;
    }[];
  };
};

export const REMOVE_PRODUCTS_FROM_WISHLIST_MUTATION = gql`
  mutation RemoveProductsFromWishlist($wishlistId: ID!, $wishlistItemsIds: [ID!]!) {
    removeProductsFromWishlist(wishlistId: $wishlistId, wishlistItemsIds: $wishlistItemsIds) {
      wishlist {
        ${WISHLIST_LIST_BODY}
      }
      user_errors {
        code
        message
      }
    }
  }
`;

export type RemoveProductsFromWishlistVariables = {
  readonly wishlistId: string;
  readonly wishlistItemsIds: readonly string[];
};

export type RemoveProductsFromWishlistResponse = {
  removeProductsFromWishlist: {
    wishlist: WishlistData;
    user_errors: readonly { readonly code: string; readonly message: string }[];
  };
};

export const UPDATE_WISHLIST_ITEMS_MUTATION = gql`
  mutation UpdateProductsInWishlist(
    $wishlistId: ID!
    $wishlistItems: [WishlistItemUpdateInput!]!
  ) {
    updateProductsInWishlist(wishlistId: $wishlistId, wishlistItems: $wishlistItems) {
      wishlist {
        ${WISHLIST_LIST_BODY}
      }
      user_errors {
        code
        message
      }
    }
  }
`;

export type WishlistItemUpdateInput = {
  readonly wishlist_item_id: string;
  readonly quantity: number;
};

export type UpdateProductsInWishlistVariables = {
  readonly wishlistId: string;
  readonly wishlistItems: readonly WishlistItemUpdateInput[];
};

export type UpdateProductsInWishlistResponse = {
  updateProductsInWishlist: {
    wishlist: WishlistData;
    user_errors: readonly { readonly code: string; readonly message: string }[];
  };
};

export const CLEAR_WISHLIST_MUTATION = gql`
  mutation ClearWishlist($wishlistId: ID!) {
    clearWishlist(wishlistId: $wishlistId) {
      wishlist {
        ${WISHLIST_LIST_BODY}
      }
      user_errors {
        code
        message
      }
    }
  }
`;

export type ClearWishlistVariables = {
  readonly wishlistId: string;
};

export type ClearWishlistResponse = {
  clearWishlist: {
    wishlist: WishlistData;
    user_errors: readonly { readonly code: string; readonly message: string }[];
  };
};

export const ADD_WISHLIST_ITEMS_TO_CART_MUTATION = gql`
  mutation AddWishlistItemsToCart($wishlistId: ID!, $wishlistItemIds: [ID!]) {
    addWishlistItemsToCart(wishlistId: $wishlistId, wishlistItemIds: $wishlistItemIds) {
      status
      wishlist {
        ${WISHLIST_LIST_BODY}
      }
      add_wishlist_items_to_cart_user_errors {
        message
        code
        wishlistItemId
      }
    }
  }
`;

export type AddWishlistItemsToCartVariables = {
  readonly wishlistId: string;
  /** Omit or pass `undefined` to add every wishlist line to the cart (Magento behavior). */
  readonly wishlistItemIds?: readonly string[];
};

export type AddWishlistItemsToCartResponse = {
  addWishlistItemsToCart: {
    status: boolean;
    wishlist: WishlistData;
    add_wishlist_items_to_cart_user_errors: readonly {
      readonly message: string;
      readonly code: string;
      readonly wishlistItemId: string;
    }[];
  };
};
