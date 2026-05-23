import { gql } from "@apollo/client";

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
