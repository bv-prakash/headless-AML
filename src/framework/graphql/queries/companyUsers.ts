import { gql } from "@apollo/client";
import type { CompanyUserStatus } from "@/src/framework/graphql/mutations/companyMutations";

/**
 * Paginated company-users list used by the **Company Users** page.
 *
 * Two things to know about this query:
 *
 *  1. Magento's `CompanyUsersFilterInput.status` is a single-value enum
 *     (`ACTIVE | INACTIVE`); there is no "all" option. Omitting the filter
 *     causes the resolver to default to ACTIVE. The UI toggles between
 *     these two states only — "Show All Users" returns to the active view.
 *
 *  2. Like elsewhere in B2B, `CompanyUser.id` is privacy-scrubbed to `null`.
 *     For edit/delete we need a real id, so we also fetch the structure
 *     in the same operation and build an `email → CompanyStructureItem.id`
 *     lookup on the client. See {@link buildEmailToEntityIdMap}.
 */

export type CompanyUsersFilterInput = {
  readonly status?: CompanyUserStatus;
};

export type CompanyUsersVariables = {
  readonly filter?: CompanyUsersFilterInput;
  readonly currentPage?: number;
  readonly pageSize?: number;
};

export type CompanyUserRoleSummary = {
  readonly id: string;
  readonly name: string;
};

export type CompanyUserTeamSummary = {
  readonly id: string;
  readonly name: string | null;
  readonly structure_id?: string | null;
};

export type CompanyUserRow = {
  /** Always `null` from Magento's storefront privacy filter — use the
   *  resolved entity id from {@link buildEmailToEntityIdMap}. */
  readonly id: number | string | null;
  readonly email: string | null;
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly job_title: string | null;
  readonly telephone: string | null;
  readonly status: CompanyUserStatus;
  readonly role: CompanyUserRoleSummary | null;
  readonly team: CompanyUserTeamSummary | null;
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

export const COMPANY_USERS_QUERY = gql`
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

/**
 * Map every `email → CompanyStructureItem.id` for users in the structure
 * response. `CompanyStructureItem.id` is the base64-encoded
 * `customer.entity_id` — exactly what `updateCompanyUser` and
 * `deleteCompanyUserV2` want as their `id: ID!` argument.
 */
export function buildEmailToEntityIdMap(
  response: CompanyUsersResponse | undefined | null,
): Map<string, string> {
  const map = new Map<string, string>();
  const items = response?.company?.structure?.items ?? [];
  for (const item of items) {
    const e = item.entity;
    if (e?.__typename !== "Customer") continue;
    const email = e.email?.trim().toLowerCase();
    if (!email) continue;
    if (!map.has(email)) map.set(email, item.id);
  }
  return map;
}

/** Full display name with fallbacks (email → "Unknown user"). */
export function userDisplayName(row: CompanyUserRow): string {
  const fullName = [row.firstname, row.lastname]
    .filter((s): s is string => !!s && s.trim() !== "")
    .join(" ")
    .trim();
  return fullName || row.email || "Unknown user";
}
