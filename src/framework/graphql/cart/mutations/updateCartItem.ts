import { gql } from "@apollo/client";
import { CART_BODY } from "../fragments";
import type { CartData } from "../types";

export const UPDATE_CART_ITEM_MUTATION = gql`
  mutation UpdateCartItem($cartId: String!, $cartItemUid: ID!, $quantity: Float!) {
    updateCartItems(
      input: {
        cart_id: $cartId
        cart_items: [{ cart_item_uid: $cartItemUid, quantity: $quantity }]
      }
    ) {
      cart {
        ${CART_BODY}
      }
    }
  }
`;

export type UpdateCartItemVariables = {
  readonly cartId: string;
  readonly cartItemUid: string;
  readonly quantity: number;
};

export type UpdateCartItemResponse = {
  updateCartItems: {
    cart: CartData;
  };
};
