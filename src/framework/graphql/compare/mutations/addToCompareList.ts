import { gql } from "@apollo/client";
import type { CompareMutationResult } from "../types";

export const ADD_TO_COMPARE_LIST_MUTATION = gql`
  mutation AddToCompareList($uid: ID!, $products: [ID]!) {
    addProductsToCompareList(input: { uid: $uid, products: $products }) {
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

export type AddToCompareListResponse = {
  addProductsToCompareList: CompareMutationResult;
};

export type AddToCompareListVariables = {
  readonly uid: string;
  readonly products: readonly number[];
};
