import { gql } from "@apollo/client";
import { WISHLIST_LIST_BODY } from "../fragments";
import type { WishlistData } from "../types";

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
