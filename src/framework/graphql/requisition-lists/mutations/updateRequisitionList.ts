import { gql } from "@apollo/client";
import type { RequisitionListRow } from "../types";

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
