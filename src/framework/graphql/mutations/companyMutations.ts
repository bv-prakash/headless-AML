import { gql } from "@apollo/client";

/**
 * Mutations for the **Company Structure** page (Magento B2B). All operations
 * are scoped to the authenticated customer's company via the auth token —
 * Magento rejects them server-side if the caller is not a company admin /
 * doesn't have the relevant ACL resource.
 *
 * All mutations target the `CompanyStructure` cache by name (`refetchQueries`
 * on the call-site) rather than re-reading the full tree manually.
 *
 * `CompanyTeam` payloads include `id` because every entity in the structure
 * union is keyed on `__typename` + `id` by Apollo; updates must round-trip
 * the same `id` to merge correctly.
 */

/* ── Team mutations ─────────────────────────────────────────── */

export const CREATE_COMPANY_TEAM_MUTATION = gql`
  mutation CreateCompanyTeam($input: CompanyTeamCreateInput!) {
    createCompanyTeam(input: $input) {
      team {
        id
        name
        description
      }
    }
  }
`;

export type CreateCompanyTeamInput = {
  readonly name: string;
  readonly description?: string;
  /**
   * Parent structure node id (Magento `target_id`). When omitted, Magento
   * attaches the new team directly under the company root.
   */
  readonly target_id?: string;
};

export type CreateCompanyTeamResponse = {
  readonly createCompanyTeam: {
    readonly team: {
      readonly id: string;
      readonly name: string | null;
      readonly description: string | null;
    } | null;
  } | null;
};

export const UPDATE_COMPANY_TEAM_MUTATION = gql`
  mutation UpdateCompanyTeam($input: CompanyTeamUpdateInput!) {
    updateCompanyTeam(input: $input) {
      team {
        id
        name
        description
      }
    }
  }
`;

export type UpdateCompanyTeamInput = {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
};

export type UpdateCompanyTeamResponse = CreateCompanyTeamResponse;

export const DELETE_COMPANY_TEAM_MUTATION = gql`
  mutation DeleteCompanyTeam($id: ID!) {
    deleteCompanyTeam(id: $id) {
      success
    }
  }
`;

export type DeleteCompanyTeamResponse = {
  readonly deleteCompanyTeam: { readonly success: boolean } | null;
};

/* ── User mutations ─────────────────────────────────────────── */

export const CREATE_COMPANY_USER_MUTATION = gql`
  mutation CreateCompanyUser($input: CompanyUserCreateInput!) {
    createCompanyUser(input: $input) {
      user {
        id
        firstname
        lastname
        email
        job_title
        telephone
      }
    }
  }
`;

export type CompanyUserStatus = "ACTIVE" | "INACTIVE";

export type CreateCompanyUserInput = {
  readonly firstname: string;
  readonly lastname: string;
  readonly email: string;
  readonly job_title: string;
  readonly telephone: string;
  readonly role_id: string;
  readonly status: CompanyUserStatus;
  /** Parent team id; defaults to company root when omitted. */
  readonly target_id?: string;
};

export type CreateCompanyUserResponse = {
  readonly createCompanyUser: {
    readonly user: {
      readonly id: number | string;
      readonly firstname: string | null;
      readonly lastname: string | null;
      readonly email: string | null;
      readonly job_title: string | null;
      readonly telephone: string | null;
    } | null;
  } | null;
};

export const UPDATE_COMPANY_USER_MUTATION = gql`
  mutation UpdateCompanyUser($input: CompanyUserUpdateInput!) {
    updateCompanyUser(input: $input) {
      user {
        id
        firstname
        lastname
        email
        job_title
        telephone
      }
    }
  }
`;

export type UpdateCompanyUserInput = {
  readonly id: string;
  readonly firstname?: string;
  readonly lastname?: string;
  readonly email?: string;
  readonly job_title?: string;
  readonly telephone?: string;
  readonly role_id?: string;
  readonly status?: CompanyUserStatus;
};

export type UpdateCompanyUserResponse = CreateCompanyUserResponse;

/**
 * Note the `V2` suffix — Magento deprecated the original `deleteCompanyUser`
 * and the storefront schema only exposes the V2 endpoint now.
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

/* ── Structure (drag-to-move) ───────────────────────────────── */

/**
 * Re-parents an existing structure node — used when implementing drag-and-
 * drop reorganisation of the tree. The current UI doesn't expose drag, but
 * the mutation is wired up so a future iteration can call it without
 * touching the GraphQL layer.
 */
export const UPDATE_COMPANY_STRUCTURE_MUTATION = gql`
  mutation UpdateCompanyStructure($input: CompanyStructureUpdateInput!) {
    updateCompanyStructure(input: $input) {
      company {
        id
        structure {
          items {
            id
            parent_id
          }
        }
      }
    }
  }
`;

export type UpdateCompanyStructureInput = {
  readonly tree_id: string;
  readonly parent_tree_id: string;
};
