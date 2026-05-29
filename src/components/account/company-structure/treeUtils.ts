import type { StructureNode } from "@/src/framework/graphql/company-structure/types";

/** Depth-first walk of a forest. The visitor sees every node exactly once,
 *  along with its already-resolved parent. */
export function walkNodes(
  nodes: ReadonlyArray<StructureNode>,
  visit: (node: StructureNode, parent: StructureNode | null) => void,
): void {
  const recurse = (
    list: ReadonlyArray<StructureNode>,
    parent: StructureNode | null,
  ) => {
    for (const n of list) {
      visit(n, parent);
      recurse(n.children, n);
    }
  };
  recurse(nodes, null);
}

/** Index every node in the forest by `item.id` for O(1) lookups. */
export function indexNodes(
  nodes: ReadonlyArray<StructureNode>,
): Map<string, StructureNode> {
  const m = new Map<string, StructureNode>();
  walkNodes(nodes, (n) => m.set(n.item.id, n));
  return m;
}

/** Map every node to its parent's `item.id` (or `null` for top-level rows). */
export function indexParents(
  nodes: ReadonlyArray<StructureNode>,
): Map<string, string | null> {
  const m = new Map<string, string | null>();
  walkNodes(nodes, (n, parent) => m.set(n.item.id, parent?.item.id ?? null));
  return m;
}

/** IDs of every team node — used to seed the expand-all state. */
export function collectTeamIds(
  nodes: ReadonlyArray<StructureNode>,
): ReadonlyArray<string> {
  const ids: string[] = [];
  walkNodes(nodes, (n) => {
    if (n.kind === "team") ids.push(n.item.id);
  });
  return ids;
}
