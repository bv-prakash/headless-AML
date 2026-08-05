import { gql } from "@apollo/client";

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
