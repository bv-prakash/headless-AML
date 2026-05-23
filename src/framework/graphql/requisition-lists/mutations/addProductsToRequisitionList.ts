import { gql } from "@apollo/client";

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
