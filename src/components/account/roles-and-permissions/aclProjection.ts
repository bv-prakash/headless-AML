import type {
  CompanyAclResourceNode,
  CompanyRolePermission,
} from "@/src/framework/graphql/roles-and-permissions/types";
import { idVariants } from "@/src/framework/graphql/utils/magentoIds";

/* ── Tree walkers ──────────────────────────────────────────── */

/** All ids in `resources`, DFS order. Drives the synthetic "All" row. */
export function collectAllAclIds(
  resources: ReadonlyArray<CompanyAclResourceNode>,
): ReadonlyArray<string> {
  const out: string[] = [];
  const walk = (list: ReadonlyArray<CompanyAclResourceNode>) => {
    for (const n of list) {
      if (n.id) out.push(n.id);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(resources);
  return out;
}

/** Ids in the subtree rooted at `node` (including `node` itself). */
export function collectSubtreeIds(
  node: CompanyAclResourceNode,
): ReadonlyArray<string> {
  const out: string[] = [];
  const walk = (n: CompanyAclResourceNode) => {
    if (n.id) out.push(n.id);
    if (n.children?.length) {
      for (const c of n.children) walk(c);
    }
  };
  walk(node);
  return out;
}

/**
 * Flatten the role's nested permission tree to every granted id.
 *
 * Every node in `role.permissions` is an explicit grant (parents and
 * leaves alike); the matching `CompanyRoleCreateInput.permissions` is
 * a flat list that includes parent and child codes side-by-side.
 */
export function collectGrantedPermissionIds(
  permissions: ReadonlyArray<CompanyRolePermission> | null | undefined,
): string[] {
  if (!permissions?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const walk = (n: CompanyRolePermission) => {
    if (n.id && !seen.has(n.id)) {
      seen.add(n.id);
      out.push(n.id);
    }
    if (n.children?.length) {
      for (const c of n.children) walk(c);
    }
  };
  for (const p of permissions) walk(p);
  return out;
}

/* ── ACL <-> checked-set projection ────────────────────────── */

/**
 * Seed the tree's `checked` set with every encoding variant of every
 * returned permission id. We don't expand into descendants — Magento's
 * `role.permissions` already lists every explicit grant.
 */
export function permissionIdsToVariantSet(
  rawIds: ReadonlyArray<string>,
): Set<string> {
  const out = new Set<string>();
  for (const id of rawIds) {
    if (!id) continue;
    out.add(id);
    for (const v of idVariants(id)) out.add(v);
  }
  return out;
}

/**
 * Project the `checked` set back to the canonical ACL ids the mutation
 * expects: every node whose own id is checked OR which has any checked
 * descendant. Including the ancestor path keeps Magento's validator
 * happy (a child "allow" requires its parent's "allow" too).
 */
export function projectCheckedToAclIds(
  resources: ReadonlyArray<CompanyAclResourceNode>,
  checked: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const isChecked = (id: string): boolean =>
    checked.has(id) || idVariants(id).some((v) => checked.has(v));
  const walk = (node: CompanyAclResourceNode): boolean => {
    let anyDescendantChecked = false;
    if (node.children?.length) {
      for (const c of node.children) {
        if (walk(c)) anyDescendantChecked = true;
      }
    }
    const selfChecked = !!node.id && isChecked(node.id);
    const include = selfChecked || anyDescendantChecked;
    if (include && node.id && !seen.has(node.id)) {
      out.push(node.id);
      seen.add(node.id);
    }
    return include;
  };
  for (const root of resources) walk(root);
  return out;
}
