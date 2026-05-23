import { gql } from "@apollo/client";

/**
 * `CompanyRoleCreateInput.permissions` is a flat `[String]` of ACL
 * resource ids (e.g. `Magento_Sales::view_orders`). Both parent and
 * leaf resources can appear; the storefront resolver de-duplicates
 * server-side.
 */
export const CREATE_COMPANY_ROLE_MUTATION = gql`
  mutation CreateCompanyRole($input: CompanyRoleCreateInput!) {
    createCompanyRole(input: $input) {
      role {
        id
        name
        users_count
      }
    }
  }
`;

export type CreateCompanyRoleInput = {
  readonly name: string;
  readonly permissions: ReadonlyArray<string>;
};

export type CreateCompanyRoleResponse = {
  readonly createCompanyRole: {
    readonly role: {
      readonly id: string;
      readonly name: string;
      readonly users_count: number | null;
    } | null;
  } | null;
};
