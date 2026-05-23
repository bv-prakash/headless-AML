import { gql } from "@apollo/client";
import type { PlaceOrderError } from "../types";

export const PLACE_ORDER = gql`
  mutation PlaceOrder($cartId: String!) {
    placeOrder(input: { cart_id: $cartId }) {
      orderV2 {
        number
      }
      errors {
        message
        code
      }
    }
  }
`;

export type PlaceOrderVariables = {
  readonly cartId: string;
};

export type PlaceOrderResponse = {
  placeOrder: {
    readonly orderV2: { readonly number: string } | null;
    readonly errors?: readonly PlaceOrderError[] | null;
  };
};
