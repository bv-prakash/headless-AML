import { gql } from "@apollo/client";

export const DELETE_COMPANY_ROLE_MUTATION = gql`
  mutation DeleteCompanyRole($id: ID!) {
    deleteCompanyRole(id: $id) {
      success
    }
  }
`;

export type DeleteCompanyRoleResponse = {
  readonly deleteCompanyRole: { readonly success: boolean } | null;
};
