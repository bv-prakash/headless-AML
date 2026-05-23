import { gql } from "@apollo/client";

/** Copy selected line items into another requisition list (source unchanged). */
export const COPY_ITEMS_BETWEEN_REQUISITION_LISTS_MUTATION = gql`
  mutation CopyItemsBetweenRequisitionLists(
    $sourceRequisitionListUid: ID!
    $destinationRequisitionListUid: ID
    $requisitionListItemUids: [ID!]!
  ) {
    copyItemsBetweenRequisitionLists(
      sourceRequisitionListUid: $sourceRequisitionListUid
      destinationRequisitionListUid: $destinationRequisitionListUid
      requisitionListItem: { requisitionListItemUids: $requisitionListItemUids }
    ) {
      requisition_list {
        uid
        name
        items_count
      }
    }
  }
`;

export type CopyItemsBetweenRequisitionListsVariables = {
  readonly sourceRequisitionListUid: string;
  readonly destinationRequisitionListUid: string;
  readonly requisitionListItemUids: ReadonlyArray<string>;
};

export type CopyItemsBetweenRequisitionListsResponse = {
  readonly copyItemsBetweenRequisitionLists: {
    readonly requisition_list: {
      readonly uid: string;
      readonly name: string;
      readonly items_count: number;
    } | null;
  } | null;
};
