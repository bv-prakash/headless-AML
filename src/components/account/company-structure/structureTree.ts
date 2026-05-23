import {
  idVariants,
  tryBase64Decode,
  tryBase64Encode,
} from "@/src/framework/graphql/utils/magentoIds";
import type {
  CompanyStructureItem,
  StructureNode,
} from "@/src/framework/graphql/company-structure/types";

/** Magento marks the synthetic "above the root" parent as `0` / `MA==`. */
const COMPANY_ROOT_PARENT_IDS = new Set<string>(["0", "MA=="]);

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
    for (const v of idVariants(sid)) idx.set(v, item.id);
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
    for (const v of idVariants(item.id)) {
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
 *  Orphans (unresolved parents) get adopted under this id when exactly
 *  one exists; with zero or multiple they stay at top level. */
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
 * See `framework/graphql/company-structure/types.ts` for the
 * namespace/privacy issues this navigates.
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
