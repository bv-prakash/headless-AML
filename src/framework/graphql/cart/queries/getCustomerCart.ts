import { gql } from "@apollo/client";
import { CART_BODY } from "../fragments";
import type { CartData } from "../types";

/** Logged-in customer's active cart (requires `X-Customer-Token`). */
export const CUSTOMER_CART_QUERY = gql`
  query CustomerCart {
    customerCart {
      ${CART_BODY}
    }
  }
`;

export type CustomerCartQueryResponse = {
  customerCart: CartData;
};
