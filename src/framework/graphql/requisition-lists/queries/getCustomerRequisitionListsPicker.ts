import { gql } from "@apollo/client";
import type { RequisitionListPickerItem } from "../types";

/**
 * Lightweight list used to populate Move / Copy destination dropdowns
 * on the detail page. Fetches just `uid` + `name` for up to 50 lists in
 * one shot so the picker doesn't need its own pagination UI.
 */
export const CUSTOMER_REQUISITION_LISTS_PICKER_QUERY = gql`
  query CustomerRequisitionListsPicker {
    customer {
      id
      requisition_lists(currentPage: 1, pageSize: 50) {
        items {
          uid
          name
        }
      }
    }
  }
`;

export type CustomerRequisitionListsPickerResponse = {
  readonly customer: {
    readonly id: number | string;
    readonly requisition_lists: {
      readonly items: ReadonlyArray<RequisitionListPickerItem> | null;
    } | null;
  } | null;
};
