import { gql } from "@apollo/client";
import { CART_BODY } from "../fragments";
import type { CartData } from "../types";

export const CART_QUERY = gql`
  query Cart($cartId: String!) {
    cart(cart_id: $cartId) {
      ${CART_BODY}
    }
  }
`;

export type CartQueryVariables = {
  readonly cartId: string;
};

export type CartQueryResponse = {
  cart: CartData;
};
