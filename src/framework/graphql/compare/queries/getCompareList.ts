import { gql } from "@apollo/client";
import type { CompareListData } from "../types";

export const COMPARE_LIST_QUERY = gql`
  query CompareList($uid: ID!) {
    compareList(uid: $uid) {
      uid
      item_count
      attributes {
        code
        label
      }
      items {
        uid
        product {
          sku
          name
          url_key
          description {
            html
          }
          small_image {
            url
          }
          price_range {
            minimum_price {
              regular_price {
                value
                currency
              }
            }
          }
        }
      }
    }
  }
`;

export type CompareListQueryResponse = {
  compareList: CompareListData | null;
};

export type CompareListQueryVariables = {
  uid: string;
};
