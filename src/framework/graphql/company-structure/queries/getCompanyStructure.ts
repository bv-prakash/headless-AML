import { gql } from "@apollo/client";
import type {
  CompanyRoleSummary,
  CompanyStructureItem,
} from "../types";

/**
 * Magento B2B `Company.structure`: a flat list of `CompanyStructureItem`
 * rows that the client assembles into a tree via `parent_id`. `roles` is
 * fetched in the same operation to populate the user modal's role
 * dropdown without a second round-trip.
 *
 * The `team_entity_id` alias avoids the union-id conflict with
 * `Customer.id` (Int). Apollo's `Customer: { keyFields: ["id"] }` would
 * otherwise miss its cache key and collapse every user into one entry.
 */
export const GET_COMPANY_STRUCTURE_QUERY = gql`
  query CompanyStructure {
    customer {
      id
      email
    }
    company {
      id
      company_admin {
        id
        email
      }
      structure {
        items {
          id
          parent_id
          entity {
            __typename
            ... on CompanyTeam {
              team_entity_id: id
              structure_id
              name
              description
            }
            ... on Customer {
              id
              firstname
              lastname
              email
              job_title
              telephone
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

export type CompanyStructureResponse = {
  readonly customer: {
    readonly id: number | string | null;
    readonly email: string | null;
  } | null;
  readonly company: {
    readonly id: string;
    readonly company_admin: {
      readonly id: number | string | null;
      readonly email: string | null;
    } | null;
    readonly structure: {
      readonly items: ReadonlyArray<CompanyStructureItem>;
    } | null;
    readonly roles: {
      readonly items: ReadonlyArray<CompanyRoleSummary>;
    } | null;
  } | null;
};
