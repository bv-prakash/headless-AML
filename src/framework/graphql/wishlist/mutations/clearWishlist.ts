import { gql } from "@apollo/client";
import { WISHLIST_LIST_BODY } from "../fragments";
import type { WishlistData } from "../types";

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
