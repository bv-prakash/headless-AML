import { gql } from "@apollo/client";
import type {
  CompanyUserRoleSummary,
  CompanyUserRow,
  CompanyUserStatus,
} from "../types";

/**
 * Paginated company-users list used by the **Company Users** page.
 *
 * `CompanyUser.id` is privacy-scrubbed to `null` by Magento, so we
 * fetch `company.structure` in the same operation and build an
 * `email → CompanyStructureItem.id` lookup on the client (see
 * `buildEmailToEntityIdMap`) to power edit/delete.
 */
export const GET_COMPANY_USERS_QUERY = gql`
  query CompanyUsers(
    $filter: CompanyUsersFilterInput
    $currentPage: Int = 1
    $pageSize: Int = 10
  ) {
    customer {
      id
      email
    }
    company {
      id
      users(filter: $filter, currentPage: $currentPage, pageSize: $pageSize) {
        total_count
        items {
          id
          email
          firstname
          lastname
          job_title
          telephone
          status
          role {
            id
            name
          }
          team {
            id
            name
            structure_id
          }
        }
        page_info {
          current_page
          page_size
          total_pages
        }
      }
      structure {
        items {
          id
          entity {
            __typename
            ... on Customer {
              email
            }
          }
        }
      }
      roles {
        items {
          id
          name
        }
      }
    }
  }
`;

export type CompanyUsersFilterInput = {
  readonly status?: CompanyUserStatus;
};

export type CompanyUsersVariables = {
  readonly filter?: CompanyUsersFilterInput;
  readonly currentPage?: number;
  readonly pageSize?: number;
};

export type CompanyUsersResponse = {
  readonly customer: {
    readonly id: number | string | null;
    readonly email: string | null;
  } | null;
  readonly company: {
    readonly id: string;
    readonly users: {
      readonly total_count: number;
      readonly items: ReadonlyArray<CompanyUserRow>;
      readonly page_info: {
        readonly current_page: number;
        readonly page_size: number;
        readonly total_pages: number;
      };
    } | null;
    readonly structure: {
      readonly items: ReadonlyArray<{
        readonly id: string;
        readonly entity: {
          readonly __typename: string;
          readonly email?: string | null;
        } | null;
      }>;
    } | null;
    readonly roles: {
      readonly items: ReadonlyArray<CompanyUserRoleSummary>;
    } | null;
  } | null;
};
