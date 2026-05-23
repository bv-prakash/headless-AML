import { gql } from "@apollo/client";

/** Remove specific line items from a requisition list. */
export const DELETE_REQUISITION_LIST_ITEMS_MUTATION = gql`
  mutation DeleteRequisitionListItems(
    $requisitionListUid: ID!
    $requisitionListItemUids: [ID!]!
  ) {
    deleteRequisitionListItems(
      requisitionListUid: $requisitionListUid
      requisitionListItemUids: $requisitionListItemUids
    ) {
      requisition_list {
        uid
        items_count
        items {
          items {
            uid
          }
        }
      }
    }
  }
`;

export type DeleteRequisitionListItemsVariables = {
  readonly requisitionListUid: string;
  readonly requisitionListItemUids: ReadonlyArray<string>;
};

export type DeleteRequisitionListItemsResponse = {
  readonly deleteRequisitionListItems: {
    readonly requisition_list: {
      readonly uid: string;
      readonly items_count: number;
      readonly items: {
        readonly items: ReadonlyArray<{ uid: string }> | null;
      } | null;
    } | null;
  } | null;
};
