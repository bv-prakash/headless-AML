import { gql } from "@apollo/client";

/**
 * Magento B2B `Company.structure`: a flat list of `CompanyStructureItem` rows
 * that the client assembles into a tree via `parent_id`.
 *
 * Two Magento quirks govern this file:
 *
 *  1. **`items[].id` ≠ `items[].parent_id`**. Magento ships `id` as the entity
 *     id (`customer.entity_id` / `company_team.entity_id`) but `parent_id` as
 *     the `company_structure` row id — a different namespace. Direct join
 *     fails; {@link buildStructureTree} reconstructs the link via
 *     `CompanyTeam.structure_id` (native) + DFS pre-order inference.
 *
 *  2. **Privacy filter strips `Customer.id` to `null`** on every resolver
 *     (verified: `customer`, `company_admin`, `Company.structure.items[].entity`,
 *     `Company.users.items[]`). The real id is exposed only on the wrapping
 *     `CompanyStructureItem.id` — that's what mutation `id` arguments and the
 *     `target_id` resolver read from. Tree "(me)" / admin matching uses email
 *     for the same reason.
 *
 * `roles` is fetched in the same operation to populate the user modal's role
 * dropdown without a second round-trip.
 */
export const COMPANY_STRUCTURE_QUERY = gql`
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
              # Aliased to avoid the union conflict with \`Customer.id (Int)\`.
              # We alias the TEAM side because Apollo's
              # \`Customer: { keyFields: ["id"] }\` would otherwise miss its
              # cache key and collapse every user into one entry.
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

/* ── Types ──────────────────────────────────────────────────── */

export type CompanyStructureTeamEntity = {
  readonly __typename: "CompanyTeam";
  /** Aliased `CompanyTeam.id` — the `company_team.entity_id` UID used by
   *  `updateCompanyTeam` / `deleteCompanyTeam`. */
  readonly team_entity_id: string;
  /** `company_structure` row id — the `target_id` value when parenting
   *  under this team. */
  readonly structure_id?: string | null;
  readonly name: string | null;
  readonly description: string | null;
};

export type CompanyStructureUserEntity = {
  readonly __typename: "Customer";
  /** Always `null` from Magento's privacy filter. Use `CompanyStructureItem.id`
   *  for mutation arguments. */
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
  /** `company_structure` row id. Optional: filled by `buildStructureTree`
   *  from `CompanyTeam.structure_id` or DFS inference. */
  readonly structure_id?: string | null;
  readonly parent_id: string | null;
  readonly entity: CompanyStructureEntity | null;
};

export type CompanyRoleSummary = {
  readonly id: string;
  readonly name: string;
};

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

/** One in-tree node — flat item + resolved children + derived display fields. */
export type StructureNode = {
  readonly item: CompanyStructureItem;
  readonly children: ReadonlyArray<StructureNode>;
  readonly label: string;
  readonly subtitle: string | null;
  readonly kind: "team" | "user" | "unknown";
};

/* ── Base64 / UID helpers ────────────────────────────────────── */

/** Magento marks the synthetic "above the root" parent as `0` / `MA==`. */
const COMPANY_ROOT_PARENT_IDS = new Set<string>(["0", "MA=="]);

function tryBase64Decode(s: string): string | null {
  if (!s) return null;
  try {
    const decoded =
      typeof atob === "function"
        ? atob(s)
        : Buffer.from(s, "base64").toString("utf-8");
    /** Reject decodings that don't look like an id, to avoid false matches. */
    return /^[A-Za-z0-9_\-:./]+$/.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function tryBase64Encode(s: string): string | null {
  if (!s) return null;
  try {
    return typeof btoa === "function"
      ? btoa(s)
      : Buffer.from(s, "utf-8").toString("base64");
  } catch {
    return null;
  }
}

/** All forms (raw + b64-decoded + b64-encoded) so we can match across
 *  encodings Magento uses inconsistently between `id` and `parent_id`. */
function variantsFor(id: string): string[] {
  const out = new Set<string>([id]);
  const dec = tryBase64Decode(id);
  if (dec) out.add(dec);
  const enc = tryBase64Encode(id);
  if (enc) out.add(enc);
  return Array.from(out);
}

/**
 * Normalise an id to the base64 UID form that Magento's `ID`-typed
 * mutation arguments (e.g. `target_id`, `updateCompanyUser.input.id`) expect.
 * Raw integer strings get encoded; already-base64 values pass through.
 */
export function toMagentoUid(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (/^\d+$/.test(value)) return tryBase64Encode(value) ?? value;
  return value;
}

/* ── Tree assembly ──────────────────────────────────────────── */

function makeNodeMeta(item: CompanyStructureItem): {
  label: string;
  subtitle: string | null;
  kind: StructureNode["kind"];
} {
  const e = item.entity;
  if (!e) return { label: "Unknown", subtitle: null, kind: "unknown" };
  if (e.__typename === "CompanyTeam") {
    return {
      label: e.name?.trim() || "Untitled team",
      subtitle: e.description?.trim() || null,
      kind: "team",
    };
  }
  const fullName = [e.firstname, e.lastname]
    .filter((s): s is string => !!s && s.trim() !== "")
    .join(" ");
  return {
    label: fullName || e.email || "Unknown user",
    subtitle: e.job_title?.trim() || e.email || null,
    kind: "user",
  };
}

/** Lift `CompanyTeam.structure_id` onto the wrapping item so downstream
 *  code reads one uniform `item.structure_id` field. */
function liftTeamStructureId(
  items: ReadonlyArray<CompanyStructureItem>,
): ReadonlyArray<CompanyStructureItem> {
  return items.map((item) => {
    if (item.structure_id) return item;
    const e = item.entity;
    if (e?.__typename === "CompanyTeam" && e.structure_id) {
      return { ...item, structure_id: String(e.structure_id) };
    }
    return item;
  });
}

/** Map `structure_id` (in every encoding) → owning entity id. */
function buildStructureIdIndex(
  items: ReadonlyArray<CompanyStructureItem>,
): Map<string, string> {
  const idx = new Map<string, string>();
  for (const item of items) {
    if (!item.structure_id) continue;
    const sid = String(item.structure_id);
    for (const v of variantsFor(sid)) idx.set(v, item.id);
  }
  return idx;
}

/**
 * DFS-inferred parent map: `unknownParentId → previousItem.id`.
 *
 * Magento emits items in DFS pre-order — a parent always precedes its
 * descendants. So the first time we encounter an unresolved `parent_id`,
 * the row immediately before it IS the parent.
 */
function inferDfsParents(
  items: ReadonlyArray<CompanyStructureItem>,
  knownStructureIds: ReadonlySet<string>,
): Map<string, string> {
  const inferred = new Map<string, string>();
  let prev: CompanyStructureItem | null = null;
  for (const item of items) {
    const pid = item.parent_id;
    if (
      pid != null &&
      !COMPANY_ROOT_PARENT_IDS.has(pid) &&
      !knownStructureIds.has(pid) &&
      !inferred.has(pid) &&
      prev != null &&
      prev.id !== item.id
    ) {
      inferred.set(pid, prev.id);
    }
    prev = item;
  }
  return inferred;
}

/** Project DFS-inferred structure ids onto each item that still lacks one. */
function enrichWithInferredStructureIds(
  items: ReadonlyArray<CompanyStructureItem>,
  dfsInferred: ReadonlyMap<string, string>,
): ReadonlyArray<CompanyStructureItem> {
  const entityToStructure = new Map<string, string>();
  for (const [structureId, entityId] of dfsInferred) {
    if (!entityToStructure.has(entityId)) {
      entityToStructure.set(entityId, structureId);
    }
  }
  return items.map((item) => {
    if (item.structure_id) return item;
    const inferred = entityToStructure.get(item.id);
    return inferred ? { ...item, structure_id: inferred } : item;
  });
}

/** Index every entity id under all of its encoding variants (raw + b64). */
function buildEntityIdIndex(
  items: ReadonlyArray<CompanyStructureItem>,
): Map<string, string> {
  const idx = new Map<string, string>();
  for (const item of items) {
    for (const v of variantsFor(item.id)) {
      if (!idx.has(v)) idx.set(v, item.id);
    }
  }
  return idx;
}

/** Resolve a raw `parent_id` to an entity id, trying every available lookup. */
function makeParentResolver(
  structureIdIndex: ReadonlyMap<string, string>,
  dfsInferred: ReadonlyMap<string, string>,
  entityIdIndex: ReadonlyMap<string, string>,
): (rawParent: string) => string | null {
  return (rawParent) => {
    const viaStructure = structureIdIndex.get(rawParent);
    if (viaStructure) return viaStructure;
    const viaDfs = dfsInferred.get(rawParent);
    if (viaDfs) return viaDfs;
    const viaEntity = entityIdIndex.get(rawParent);
    if (viaEntity) return viaEntity;
    const decoded = tryBase64Decode(rawParent);
    if (decoded && entityIdIndex.has(decoded)) return entityIdIndex.get(decoded) ?? null;
    const encoded = tryBase64Encode(rawParent);
    if (encoded && entityIdIndex.has(encoded)) return entityIdIndex.get(encoded) ?? null;
    return null;
  };
}

/** The single row marked as "above the root" — usually the company admin.
 *  Orphans (unresolved parents) get adopted under this id when exactly one
 *  exists; with zero or multiple they stay at top level. */
function findAdminId(items: ReadonlyArray<CompanyStructureItem>): string | null {
  const candidates = items.filter(
    (i) => i.parent_id != null && COMPANY_ROOT_PARENT_IDS.has(i.parent_id),
  );
  return candidates.length === 1 ? candidates[0].id : null;
}

/** Build a `parentEntityId → children[]` map respecting the admin fallback. */
function groupByParent(
  items: ReadonlyArray<CompanyStructureItem>,
  resolveParent: (rawParent: string) => string | null,
  adminId: string | null,
): Map<string | null, CompanyStructureItem[]> {
  const byParent = new Map<string | null, CompanyStructureItem[]>();
  for (const item of items) {
    const raw = item.parent_id;
    let parent: string | null;

    if (raw == null || COMPANY_ROOT_PARENT_IDS.has(raw)) {
      parent = null;
    } else {
      const resolved = resolveParent(raw);
      if (resolved != null && resolved !== item.id) {
        parent = resolved;
      } else if (adminId != null && item.id !== adminId) {
        parent = adminId;
      } else {
        parent = null;
      }
    }

    const bucket = byParent.get(parent);
    if (bucket) bucket.push(item);
    else byParent.set(parent, [item]);
  }
  return byParent;
}

/** Recursively build StructureNode forest from a `parentEntityId → children[]` map. */
function buildForest(
  byParent: ReadonlyMap<string | null, CompanyStructureItem[]>,
  parentId: string | null,
): StructureNode[] {
  return (byParent.get(parentId) ?? []).map((item) => ({
    item,
    children: buildForest(byParent, item.id),
    ...makeNodeMeta(item),
  }));
}

/**
 * Assemble Magento's flat structure list into a `StructureNode` forest.
 * See the file header for the namespace/privacy issues this navigates.
 */
export function buildStructureTree(
  rawItems: ReadonlyArray<CompanyStructureItem>,
): ReadonlyArray<StructureNode> {
  const withTeamSid = liftTeamStructureId(rawItems);
  const structureIdIndex = buildStructureIdIndex(withTeamSid);
  const dfsInferred = inferDfsParents(
    withTeamSid,
    new Set(structureIdIndex.keys()),
  );
  const enriched = enrichWithInferredStructureIds(withTeamSid, dfsInferred);

  const entityIdIndex = buildEntityIdIndex(enriched);
  const resolveParent = makeParentResolver(
    structureIdIndex,
    dfsInferred,
    entityIdIndex,
  );
  const adminId = findAdminId(enriched);
  const byParent = groupByParent(enriched, resolveParent, adminId);

  return buildForest(byParent, null);
}
