import { gql } from "@apollo/client";
import type { RequisitionListRow } from "@/src/framework/graphql/queries/requisitionLists";

/** Magento mutation: create a new requisition list (name required, description optional). */
export const CREATE_REQUISITION_LIST_MUTATION = gql`
  mutation CreateRequisitionList($input: CreateRequisitionListInput!) {
    createRequisitionList(input: $input) {
      requisition_list {
        uid
        name
        description
        items_count
        updated_at
      }
    }
  }
`;

export type CreateRequisitionListInput = {
  readonly name: string;
  readonly description?: string;
};

export type CreateRequisitionListVariables = {
  readonly input: CreateRequisitionListInput;
};

export type CreateRequisitionListResponse = {
  readonly createRequisitionList: {
    readonly requisition_list: RequisitionListRow | null;
  } | null;
};

/** Delete an entire requisition list by uid. */
export const DELETE_REQUISITION_LIST_MUTATION = gql`
  mutation DeleteRequisitionList($requisitionListUid: ID!) {
    deleteRequisitionList(requisitionListUid: $requisitionListUid) {
      status
    }
  }
`;

export type DeleteRequisitionListVariables = {
  readonly requisitionListUid: string;
};

export type DeleteRequisitionListResponse = {
  readonly deleteRequisitionList: {
    readonly status: boolean;
  } | null;
};

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

/** Rename / update description of a requisition list. */
export const UPDATE_REQUISITION_LIST_MUTATION = gql`
  mutation UpdateRequisitionList(
    $requisitionListUid: ID!
    $input: UpdateRequisitionListInput!
  ) {
    updateRequisitionList(
      requisitionListUid: $requisitionListUid
      input: $input
    ) {
      requisition_list {
        uid
        name
        description
        items_count
        updated_at
      }
    }
  }
`;

export type UpdateRequisitionListInput = {
  readonly name: string;
  readonly description?: string;
};

export type UpdateRequisitionListVariables = {
  readonly requisitionListUid: string;
  readonly input: UpdateRequisitionListInput;
};

export type UpdateRequisitionListResponse = {
  readonly updateRequisitionList: {
    readonly requisition_list: RequisitionListRow | null;
  } | null;
};

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

/**
 * Move selected line items from one requisition list to another. The source
 * list loses the items; the destination gains them. Returns updated counts on
 * both lists so the UI can confirm without an extra refetch.
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

/**
 * Add product(s) to an existing requisition list. Used by the PDP
 * "Add to Requisition List" button after the customer picks a target list.
 */
export const ADD_PRODUCTS_TO_REQUISITION_LIST_MUTATION = gql`
  mutation AddProductsToRequisitionList(
    $requisitionListUid: ID!
    $requisitionListItems: [RequisitionListItemsInput!]!
  ) {
    addProductsToRequisitionList(
      requisitionListUid: $requisitionListUid
      requisitionListItems: $requisitionListItems
    ) {
      requisition_list {
        uid
        name
        items_count
        updated_at
      }
    }
  }
`;

export type RequisitionListItemsInput = {
  readonly sku: string;
  readonly quantity?: number;
  readonly parent_sku?: string;
  readonly selected_options?: ReadonlyArray<string>;
  readonly entered_options?: ReadonlyArray<{ readonly uid: string; readonly value: string }>;
};

export type AddProductsToRequisitionListVariables = {
  readonly requisitionListUid: string;
  readonly requisitionListItems: ReadonlyArray<RequisitionListItemsInput>;
};

export type AddProductsToRequisitionListResponse = {
  readonly addProductsToRequisitionList: {
    readonly requisition_list: {
      readonly uid: string;
      readonly name: string;
      readonly items_count: number;
      readonly updated_at: string | null;
    } | null;
  } | null;
};
