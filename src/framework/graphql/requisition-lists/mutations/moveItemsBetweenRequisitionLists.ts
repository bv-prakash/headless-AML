import { gql } from "@apollo/client";

/**
 * Move selected line items from one requisition list to another. The
 * source list loses the items; the destination gains them. Returns
 * updated counts on both lists so the UI can confirm without an extra
 * refetch.
 */
export const MOVE_ITEMS_BETWEEN_REQUISITION_LISTS_MUTATION = gql`
  mutation MoveItemsBetweenRequisitionLists(
    $sourceRequisitionListUid: ID!
    $destinationRequisitionListUid: ID
    $requisitionListItemUids: [ID!]!
  ) {
    moveItemsBetweenRequisitionLists(
      sourceRequisitionListUid: $sourceRequisitionListUid
      destinationRequisitionListUid: $destinationRequisitionListUid
      requisitionListItem: { requisitionListItemUids: $requisitionListItemUids }
    ) {
      source_requisition_list {
        uid
        name
        items_count
      }
      destination_requisition_list {
        uid
        name
        items_count
      }
    }
  }
`;

export type MoveItemsBetweenRequisitionListsVariables = {
  readonly sourceRequisitionListUid: string;
  readonly destinationRequisitionListUid: string;
  readonly requisitionListItemUids: ReadonlyArray<string>;
};

export type MoveItemsBetweenRequisitionListsResponse = {
  readonly moveItemsBetweenRequisitionLists: {
    readonly source_requisition_list: {
      readonly uid: string;
      readonly name: string;
      readonly items_count: number;
    } | null;
    readonly destination_requisition_list: {
      readonly uid: string;
      readonly name: string;
      readonly items_count: number;
    } | null;
  } | null;
};
