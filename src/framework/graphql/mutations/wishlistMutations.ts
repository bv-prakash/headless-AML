import { gql } from "@apollo/client";

export const CUSTOMER_WISHLIST_QUERY = gql`
  query CustomerWishlist {
    customer {
      wishlist {
        id
        items_count
      }
    }
  }
`;

export type CustomerWishlistResponse = {
  customer: {
    wishlist: {
      id: string;
      items_count: number;
    };
  };
};

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
        items_v2(currentPage: 1, pageSize: 8) {
          items {
            id
            quantity
            ... on BundleWishlistItem {
              bundle_options {
                values {
                  id
                  label
                  quantity
                }
              }
            }
            product {
              uid
              name
              sku
              price_range {
                minimum_price {
                  regular_price {
                    currency
                    value
                  }
                }
                maximum_price {
                  regular_price {
                    currency
                    value
                  }
                }
              }
            }
          }
        }
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

export type WishlistPrice = {
  readonly regular_price: {
    readonly currency: string;
    readonly value: number;
  };
};

export type WishlistProductItem = {
  readonly id: string;
  readonly quantity: number;
  readonly bundle_options?: readonly {
    readonly values: readonly {
      readonly id: string;
      readonly label: string;
      readonly quantity: number;
    }[];
  }[];
  readonly product: {
    readonly uid: string;
    readonly name: string;
    readonly sku: string;
    readonly price_range: {
      readonly minimum_price: WishlistPrice;
      readonly maximum_price: WishlistPrice;
    };
  };
};

export type AddToWishlistResponse = {
  addProductsToWishlist: {
    wishlist: {
      id: string;
      items_count: number;
      items_v2: {
        items: readonly WishlistProductItem[];
      };
    };
    user_errors: readonly {
      code: string;
      message: string;
    }[];
  };
};
