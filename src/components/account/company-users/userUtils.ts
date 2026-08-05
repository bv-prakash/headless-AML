import type { CompanyUsersResponse } from "@/src/framework/graphql/company-users/queries/getCompanyUsers";
import type { CompanyUserRow } from "@/src/framework/graphql/company-users/types";

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
