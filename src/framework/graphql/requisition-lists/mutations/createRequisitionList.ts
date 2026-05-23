import { gql } from "@apollo/client";
import type { RequisitionListRow } from "../types";

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
