/**
 * Shared TypeScript types for the Company Structure GraphQL surface.
 *
 * Two Magento quirks shape these types:
 *
 *  1. **`items[].id` ≠ `items[].parent_id`**. Magento ships `id` as the
 *     entity id (`customer.entity_id` / `company_team.entity_id`) but
 *     `parent_id` as the `company_structure` row id — a different
 *     namespace. The client tree-builder reconciles these.
 *
 *  2. **Privacy filter strips `Customer.id` to `null`**. The real id is
 *     exposed only on the wrapping `CompanyStructureItem.id` — that's
 *     what mutation `id` arguments and the `target_id` resolver read.
 */

export type CompanyStructureTeamEntity = {
  readonly __typename: "CompanyTeam";
  /** Aliased `CompanyTeam.id` — the `company_team.entity_id` UID used
   *  by `updateCompanyTeam` / `deleteCompanyTeam`. */
  readonly team_entity_id: string;
  /** `company_structure` row id — the `target_id` value when parenting
   *  under this team. */
  readonly structure_id?: string | null;
  readonly name: string | null;
  readonly description: string | null;
};

export type CompanyStructureUserEntity = {
  readonly __typename: "Customer";
  /** Always `null` from Magento's privacy filter. Use
   *  `CompanyStructureItem.id` for mutation arguments. */
  readonly id: number | string | null;
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly email: string | null;
  readonly job_title: string | null;
  readonly telephone: string | null;
};

export type CompanyStructureEntity =
  | CompanyStructureTeamEntity
  | CompanyStructureUserEntity;

export type CompanyStructureItem = {
  /** Entity id of the row (`customer.entity_id` for users,
   *  `company_team.entity_id` for teams) — base64 UID. */
  readonly id: string;
  /** `company_structure` row id. Optional: filled by the tree-builder
   *  from `CompanyTeam.structure_id` or DFS inference. */
  readonly structure_id?: string | null;
  readonly parent_id: string | null;
  readonly entity: CompanyStructureEntity | null;
};

export type CompanyRoleSummary = {
  readonly id: string;
  readonly name: string;
};

/** One in-tree node — flat item + resolved children + derived display fields. */
export type StructureNode = {
  readonly item: CompanyStructureItem;
  readonly children: ReadonlyArray<StructureNode>;
  readonly label: string;
  readonly subtitle: string | null;
  readonly kind: "team" | "user" | "unknown";
};
