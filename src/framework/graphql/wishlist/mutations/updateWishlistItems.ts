import { gql } from "@apollo/client";
import { WISHLIST_LIST_BODY } from "../fragments";
import type { WishlistData } from "../types";

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
