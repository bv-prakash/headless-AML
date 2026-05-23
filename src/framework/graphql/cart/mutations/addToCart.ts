import { gql } from "@apollo/client";
import { CART_ADD_RESPONSE_BODY } from "../fragments";
import type { CartData } from "../types";

export const ADD_TO_CART_MUTATION = gql`
  mutation AddToCart($cartId: String!, $sku: String!, $quantity: Float!) {
    addSimpleProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [{ data: { quantity: $quantity, sku: $sku } }]
      }
    ) {
      cart {
        ${CART_ADD_RESPONSE_BODY}
      }
    }
  }
`;

export type AddToCartVariables = {
  readonly cartId: string;
  readonly sku: string;
  readonly quantity: number;
};

export type AddToCartResponse = {
  addSimpleProductsToCart: {
    cart: CartData;
  };
};
