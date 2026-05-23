import { gql } from "@apollo/client";
import type { CompareMutationResult } from "../types";

export const CREATE_COMPARE_LIST_MUTATION = gql`
  mutation CreateCompareList($products: [ID]!) {
    createCompareList(input: { products: $products }) {
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

export type CreateCompareListResponse = {
  createCompareList: CompareMutationResult;
};

export type CreateCompareListVariables = {
  readonly products: readonly number[];
};
