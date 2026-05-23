import { gql } from "@apollo/client";
import { CART_BODY } from "../fragments";
import type { CartData } from "../types";

export const REMOVE_CART_ITEM_MUTATION = gql`
  mutation RemoveCartItem($cartId: String!, $cartItemUid: ID!) {
    removeItemFromCart(input: { cart_id: $cartId, cart_item_uid: $cartItemUid }) {
      cart {
        ${CART_BODY}
      }
    }
  }
`;

export type RemoveCartItemVariables = {
  readonly cartId: string;
  readonly cartItemUid: string;
};

export type RemoveCartItemResponse = {
  removeItemFromCart: {
    cart: CartData;
  };
};
