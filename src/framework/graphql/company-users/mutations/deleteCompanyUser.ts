import { gql } from "@apollo/client";

/**
 * Note the `V2` suffix — Magento deprecated the original
 * `deleteCompanyUser` and the storefront schema only exposes the V2
 * endpoint now.
 */
export const DELETE_COMPANY_USER_MUTATION = gql`
  mutation DeleteCompanyUserV2($id: ID!) {
    deleteCompanyUserV2(id: $id) {
      success
    }
  }
`;

export type DeleteCompanyUserResponse = {
  readonly deleteCompanyUserV2: { readonly success: boolean } | null;
};
