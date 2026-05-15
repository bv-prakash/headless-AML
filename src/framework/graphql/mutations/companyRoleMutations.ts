import { gql } from "@apollo/client";

/**
 * Mutations for the Roles and Permissions page.
 *
 * Magento's `CompanyRole(Create|Update)Input.permissions` is a `[String]` of
 * ACL resource ids (e.g. `Magento_Sales::view_orders`). Both parent and leaf
 * resources can appear in the list — the storefront resolver de-duplicates
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

export const UPDATE_COMPANY_ROLE_MUTATION = gql`
  mutation UpdateCompanyRole($input: CompanyRoleUpdateInput!) {
    updateCompanyRole(input: $input) {
      role {
        id
        name
        users_count
      }
    }
  }
`;

export const DELETE_COMPANY_ROLE_MUTATION = gql`
  mutation DeleteCompanyRole($id: ID!) {
    deleteCompanyRole(id: $id) {
      success
    }
  }
`;

export type CompanyRoleCreateInput = {
  readonly name: string;
  readonly permissions: ReadonlyArray<string>;
};

export type CompanyRoleUpdateInput = {
  readonly id: string;
  readonly name?: string;
  readonly permissions?: ReadonlyArray<string>;
};

export type CompanyRoleMutationResponse = {
  readonly role: {
    readonly id: string;
    readonly name: string;
    readonly users_count: number | null;
  } | null;
};

export type CreateCompanyRoleResponse = {
  readonly createCompanyRole: CompanyRoleMutationResponse | null;
};

export type UpdateCompanyRoleResponse = {
  readonly updateCompanyRole: CompanyRoleMutationResponse | null;
};

export type DeleteCompanyRoleResponse = {
  readonly deleteCompanyRole: { readonly success: boolean } | null;
};
