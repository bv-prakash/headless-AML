import { gql } from "@apollo/client";

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

export type UpdateCompanyRoleInput = {
  readonly id: string;
  readonly name?: string;
  readonly permissions?: ReadonlyArray<string>;
};

export type UpdateCompanyRoleResponse = {
  readonly updateCompanyRole: {
    readonly role: {
      readonly id: string;
      readonly name: string;
      readonly users_count: number | null;
    } | null;
  } | null;
};
