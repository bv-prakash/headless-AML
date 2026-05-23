import { gql } from "@apollo/client";
import type { CompareMutationResult } from "../types";

export const REMOVE_FROM_COMPARE_LIST_MUTATION = gql`
  mutation RemoveFromCompareList($uid: ID!, $products: [ID]!) {
    removeProductsFromCompareList(input: { uid: $uid, products: $products }) {
      uid
      item_count
      items {
        uid
        product {
          sku
          name
        }
      }
    }
  }
`;

export type RemoveFromCompareListResponse = {
  removeProductsFromCompareList: CompareMutationResult;
};

export type RemoveFromCompareListVariables = {
  readonly uid: string;
  readonly products: readonly string[];
};
