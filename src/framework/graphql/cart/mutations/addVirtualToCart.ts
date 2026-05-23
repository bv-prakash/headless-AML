import { gql } from "@apollo/client";
import { CART_ADD_RESPONSE_BODY } from "../fragments";
import type { CartData } from "../types";

export const ADD_VIRTUAL_TO_CART_MUTATION = gql`
  mutation AddVirtualToCart($cartId: String!, $sku: String!, $quantity: Float!) {
    addVirtualProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [{ data: { sku: $sku, quantity: $quantity } }]
      }
    ) {
      cart {
        ${CART_ADD_RESPONSE_BODY}
      }
    }
  }
`;

export type AddVirtualToCartVariables = {
  readonly cartId: string;
  readonly sku: string;
  readonly quantity: number;
};

export type AddVirtualToCartResponse = {
  addVirtualProductsToCart: {
    cart: CartData;
  };
};
