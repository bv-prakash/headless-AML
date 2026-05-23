import { gql } from "@apollo/client";
import { CART_BODY } from "../fragments";
import type { CartData } from "../types";

/** Merge guest cart into the customer cart after login (requires customer token). */
export const MERGE_CARTS_MUTATION = gql`
  mutation MergeCarts($source_cart_id: String!) {
    mergeCarts(source_cart_id: $source_cart_id) {
      ${CART_BODY}
    }
  }
`;

export type MergeCartsVariables = {
  readonly source_cart_id: string;
};

export type MergeCartsResponse = {
  mergeCarts: CartData;
};
