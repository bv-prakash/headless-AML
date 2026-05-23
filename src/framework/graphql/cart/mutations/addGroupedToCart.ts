import { gql } from "@apollo/client";
import { CART_ADD_RESPONSE_BODY } from "../fragments";
import type { CartData } from "../types";

export const ADD_GROUPED_TO_CART_MUTATION = gql`
  mutation AddGroupedToCart($cartId: String!, $cartItems: [SimpleProductCartItemInput!]!) {
    addSimpleProductsToCart(input: { cart_id: $cartId, cart_items: $cartItems }) {
      cart {
        ${CART_ADD_RESPONSE_BODY}
      }
    }
  }
`;

export type GroupedCartItemInput = {
  readonly data: {
    readonly sku: string;
    readonly quantity: number;
  };
};

export type AddGroupedToCartVariables = {
  readonly cartId: string;
  readonly cartItems: readonly GroupedCartItemInput[];
};

export type AddGroupedToCartResponse = {
  addSimpleProductsToCart: {
    cart: CartData;
  };
};
