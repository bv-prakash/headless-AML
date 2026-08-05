import { gql } from "@apollo/client";
import type { CompanyRoleListItem } from "@/src/framework/graphql/roles-and-permissions/types";

/**
 * Single-role detail for the edit form. The nested `permissions` tree
 * must be queried 4-deep so each granted leaf (and the parent codes
 * Magento implicitly stores along the path) is hydrated, not just the
 * top-level grants.
 */
export const GET_COMPANY_ROLE_QUERY = gql`
  query CompanyRoleDetail($id: ID!) {
    company {
      id
      role(id: $id) {
        id
        name
        users_count
        permissions {
          id
          text
          sort_order
          children {
            id
            text
            sort_order
            children {
              id
              text
              sort_order
              children {
                id
                text
                sort_order
              }
            }
          }
        }
      }
    }
  }
`;

export type GetCompanyRoleVariables = {
  readonly id: string;
};

export type GetCompanyRoleResponse = {
  readonly company: {
    readonly id: string;
    readonly role: CompanyRoleListItem | null;
  } | null;
};
