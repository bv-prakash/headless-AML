import { gql } from "@apollo/client";
import { CART_ADD_RESPONSE_BODY } from "../fragments";
import type { CartData } from "../types";

export const ADD_BUNDLE_TO_CART_MUTATION = gql`
  mutation AddBundleToCart(
    $cartId: String!
    $sku: String!
    $quantity: Float!
    $bundleOptions: [BundleOptionInput!]!
  ) {
    addBundleProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [
          {
            data: { sku: $sku, quantity: $quantity }
            bundle_options: $bundleOptions
          }
        ]
      }
    ) {
      cart {
        ${CART_ADD_RESPONSE_BODY}
      }
    }
  }
`;

export type BundleOptionInput = {
  readonly id: number;
  readonly quantity: number;
  readonly value: readonly string[];
};

export type AddBundleToCartVariables = {
  readonly cartId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly bundleOptions: readonly BundleOptionInput[];
};

export type AddBundleToCartResponse = {
  addBundleProductsToCart: {
    cart: CartData;
  };
};
