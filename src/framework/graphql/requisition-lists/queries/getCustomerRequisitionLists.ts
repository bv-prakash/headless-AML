import { gql } from "@apollo/client";
import type { RequisitionListRow } from "../types";

/**
 * Customer requisition lists (paginated). Returns the rows that power
 * the `/account/requisition-lists` table — name, description, item
 * count, and last-activity timestamp. `id` on `customer` is required
 * because Apollo's cache uses it as the `Customer` keyField.
 */
export const CUSTOMER_REQUISITION_LISTS_QUERY = gql`
  query CustomerRequisitionLists($currentPage: Int!, $pageSize: Int!) {
    customer {
      id
      requisition_lists(currentPage: $currentPage, pageSize: $pageSize) {
        total_count
        items {
          uid
          name
          description
          items_count
          updated_at
        }
      }
    }
  }
`;

export type CustomerRequisitionListsVariables = {
  readonly currentPage: number;
  readonly pageSize: number;
};

export type CustomerRequisitionListsResponse = {
  readonly customer: {
    readonly id: number | string;
    readonly requisition_lists: {
      readonly total_count: number | null;
      readonly items: ReadonlyArray<RequisitionListRow> | null;
    } | null;
  } | null;
};
