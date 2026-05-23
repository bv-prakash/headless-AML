import { gql } from "@apollo/client";
import type { RequisitionListDetail } from "../types";

/**
 * Single requisition list (looked up by `uid`). Magento's schema
 * doesn't expose a top-level `requisitionList(uid:)` query — we have to
 * filter the customer's paginated list by `{ uids: { eq: <uid> } }` and
 * take the first (and only) result.
 */
export const CUSTOMER_REQUISITION_LIST_DETAIL_QUERY = gql`
  query CustomerRequisitionListDetail($uid: String!) {
    customer {
      id
      requisition_lists(filter: { uids: { eq: $uid } }, currentPage: 1, pageSize: 1) {
        items {
          uid
          name
          description
          items_count
          updated_at
          items {
            items {
              uid
              quantity
              product {
                __typename
                uid
                sku
                name
                url_key
                stock_status
                small_image {
                  url
                  label
                }
                price_range {
                  minimum_price {
                    final_price {
                      value
                      currency
                    }
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
      }
    }
  }
`;

export type CustomerRequisitionListDetailVariables = {
  readonly uid: string;
};

export type CustomerRequisitionListDetailResponse = {
  readonly customer: {
    readonly id: number | string;
    readonly requisition_lists: {
      readonly items: ReadonlyArray<RequisitionListDetail> | null;
    } | null;
  } | null;
};
