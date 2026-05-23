import { gql } from "@apollo/client";
import { WISHLIST_LIST_BODY } from "../fragments";
import type { WishlistData } from "../types";

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
