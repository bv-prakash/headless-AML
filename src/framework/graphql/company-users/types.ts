/**
 * Shared TypeScript types for the Company Users GraphQL surface.
 *
 * `CompanyUserStatus` is the single-value enum Magento uses; there is no
 * "all" option. The Company Users page toggles between ACTIVE and
 * INACTIVE only — omitting the filter defaults the resolver to ACTIVE.
 */

export type CompanyUserStatus = "ACTIVE" | "INACTIVE";

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
   *  resolved entity id from `buildEmailToEntityIdMap`. */
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
