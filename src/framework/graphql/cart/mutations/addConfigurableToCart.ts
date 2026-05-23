import { gql } from "@apollo/client";
import { CART_ADD_RESPONSE_BODY } from "../fragments";
import type { CartData } from "../types";

export const ADD_CONFIGURABLE_TO_CART_MUTATION = gql`
  mutation AddConfigurableToCart(
    $cartId: String!
    $parentSku: String!
    $variantSku: String!
    $quantity: Float!
  ) {
    addConfigurableProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [
          {
            parent_sku: $parentSku
            data: { sku: $variantSku, quantity: $quantity }
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

export type AddConfigurableToCartVariables = {
  readonly cartId: string;
  readonly parentSku: string;
  readonly variantSku: string;
  readonly quantity: number;
};

export type AddConfigurableToCartResponse = {
  addConfigurableProductsToCart: {
    cart: CartData;
  };
};
