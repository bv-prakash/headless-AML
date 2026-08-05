import { gql } from "@apollo/client";

/** Bulk-update quantities on existing line items in a requisition list. */
export const UPDATE_REQUISITION_LIST_ITEMS_MUTATION = gql`
  mutation UpdateRequisitionListItems(
    $requisitionListUid: ID!
    $requisitionListItems: [UpdateRequisitionListItemsInput!]!
  ) {
    updateRequisitionListItems(
      requisitionListUid: $requisitionListUid
      requisitionListItems: $requisitionListItems
    ) {
      requisition_list {
        uid
        items_count
        updated_at
        items {
          items {
            uid
            quantity
          }
        }
      }
    }
  }
`;

export type UpdateRequisitionListItemInput = {
  readonly item_id: string;
  readonly quantity?: number;
  readonly selected_options?: ReadonlyArray<string>;
  readonly entered_options?: ReadonlyArray<{ readonly uid: string; readonly value: string }>;
};

export type UpdateRequisitionListItemsVariables = {
  readonly requisitionListUid: string;
  readonly requisitionListItems: ReadonlyArray<UpdateRequisitionListItemInput>;
};

export type UpdateRequisitionListItemsResponse = {
  readonly updateRequisitionListItems: {
    readonly requisition_list: {
      readonly uid: string;
      readonly items_count: number;
      readonly updated_at: string | null;
      readonly items: {
        readonly items: ReadonlyArray<{ uid: string; quantity: number }> | null;
      } | null;
    } | null;
  } | null;
};
