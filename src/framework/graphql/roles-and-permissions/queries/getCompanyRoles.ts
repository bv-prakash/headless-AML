import { gql } from "@apollo/client";
import type { CompanyRoleListItem } from "@/src/framework/graphql/roles-and-permissions/types";

/**
 * Paginated company-role list. The nested 4-deep `permissions` mirrors
 * the granted tree so the list page's "Duplicate" action can replay
 * the exact grant set without a second round-trip.
 */
export const GET_COMPANY_ROLES_QUERY = gql`
  query CompanyRoles($currentPage: Int = 1, $pageSize: Int = 20) {
    company {
      id
      roles(currentPage: $currentPage, pageSize: $pageSize) {
        total_count
        items {
          id
          name
          users_count
          permissions {
            id
            children {
              id
              children {
                id
                children {
                  id
                }
              }
            }
          }
        }
        page_info {
          current_page
          page_size
          total_pages
        }
      }
    }
  }
`;

export type GetCompanyRolesVariables = {
  readonly currentPage?: number;
  readonly pageSize?: number;
};

export type GetCompanyRolesResponse = {
  readonly company: {
    readonly id: string;
    readonly roles: {
      readonly total_count: number;
      readonly items: ReadonlyArray<CompanyRoleListItem>;
      readonly page_info: {
        readonly current_page: number;
        readonly page_size: number;
        readonly total_pages: number;
      };
    } | null;
  } | null;
};
