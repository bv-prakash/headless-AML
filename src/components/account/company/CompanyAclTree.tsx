"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collectAllAclIds,
  collectSubtreeIds,
  type CompanyAclResourceNode,
} from "@/src/framework/graphql/queries/companyRoles";
import { idVariants } from "@/src/framework/graphql/utils/magentoIds";

type Props = {
  readonly resources: ReadonlyArray<CompanyAclResourceNode>;
  /** Currently checked permission ids. */
  readonly checked: ReadonlySet<string>;
  readonly onChange: (next: ReadonlySet<string>) => void;
};

/**
 * Hierarchical permissions tree (standard cascading-checkbox UX).
 *
 *  - Clicking a row toggles its **entire subtree** atomically. Clicking
 *    `Company Profile` ticks `Company Profile` and every descendant in
 *    one go; clicking it again unticks the lot.
 *  - Each row's checkbox state is **aggregated** from its subtree:
 *      • every descendant ticked → checked
 *      • some descendants ticked → indeterminate
 *      • none ticked            → unchecked
 *    So if a user picks each child individually, the parent
 *    automatically displays as checked.
 *  - A virtual "All" row at the top is just the same logic applied to
 *    the whole tree — a select-all/select-none helper.
 *  - Expand-All / Collapse-All affect every group simultaneously.
 *
 * The component is fully controlled — the parent owns the `checked` set.
 */
/** Detect Magento's own root "All" node. Magento's ACL tree usually
 *  ships a single top-level resource (`Magento_Backend::all`) whose
 *  label is "All" — rendering it inside our synthetic "All" row would
 *  duplicate the row. When we detect this shape we render the root's
 *  *children* under the synthetic row instead. */
function isMagentoAllRoot(node: CompanyAclResourceNode): boolean {
  const label = (node.text ?? "").trim().toLowerCase();
  return label === "all" && !!node.children?.length;
}

export const CompanyAclTree = memo(function CompanyAclTree({
  resources,
  checked,
  onChange,
}: Props) {
  /** Unwrap the redundant top-level "All" node Magento ships, so the
   *  synthetic "All" row at the top isn't duplicated. */
  const displayResources = useMemo<ReadonlyArray<CompanyAclResourceNode>>(
    () =>
      resources.length === 1 && isMagentoAllRoot(resources[0])
        ? resources[0].children ?? []
        : resources,
    [resources],
  );

  const allIds = useMemo(
    () => collectAllAclIds(displayResources),
    [displayResources],
  );
  const groupIds = useMemo(
    () => collectGroupIds(displayResources),
    [displayResources],
  );

  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(groupIds),
  );

  /** Re-seed expansion when the source data changes (e.g. on first load). */
  useEffect(() => {
    setExpanded(new Set(groupIds));
  }, [groupIds]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(
    () => setExpanded(new Set(groupIds)),
    [groupIds],
  );
  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  /** Atomic subtree toggle.
   *
   *  Clicking a parent applies the same on/off action to every descendant
   *  (and to the parent itself), so the user gets cascading select-down.
   *  For leaf nodes the "subtree" is just the leaf itself — same code,
   *  same result.
   *
   *  Variant-aware: `checked` may carry both the raw resource code and
   *  its base64 UID for any one id (seeded from the backend on hydrate).
   *  When we flip "off" we drop **every** encoding so a leftover variant
   *  doesn't make the next render look stuck-on. */
  const toggleSubtree = useCallback(
    (ids: ReadonlyArray<string>) => {
      if (ids.length === 0) return;
      const allOn = ids.every((id) => checkedHasVariant(id, checked));
      const next = new Set(checked);
      for (const id of ids) {
        if (allOn) {
          next.delete(id);
          for (const v of idVariants(id)) next.delete(v);
        } else {
          next.add(id);
          for (const v of idVariants(id)) next.add(v);
        }
      }
      onChange(next);
    },
    [checked, onChange],
  );

  const toggleAll = useCallback(
    () => toggleSubtree(allIds),
    [allIds, toggleSubtree],
  );

  const allCheckedState = computeCheckState(allIds, checked);
  const allExpanded =
    groupIds.length > 0 && groupIds.every((id) => expanded.has(id));

  return (
    <div className="space-y-3">
      <div className="text-sm text-theme-primary">
        <button type="button" onClick={expandAll} className="hover:underline">
          Expand All
        </button>
        <span className="mx-2 text-gray-400">|</span>
        <button type="button" onClick={collapseAll} className="hover:underline">
          Collapse All
        </button>
      </div>

      <ul className="m-0 p-0 list-none text-sm" role="tree">
        <AllRow
          state={allCheckedState}
          onToggle={toggleAll}
          expanded={allExpanded}
          onToggleExpand={allExpanded ? collapseAll : expandAll}
        >
          {displayResources.map((node, idx) => (
            <AclRow
              key={node.id ?? `__${idx}`}
              node={node}
              checked={checked}
              expanded={expanded}
              onToggleSubtree={toggleSubtree}
              onToggleExpand={toggleExpand}
            />
          ))}
        </AllRow>
      </ul>
    </div>
  );
});

/* ── Rows ────────────────────────────────────────────────────── */

type CheckState = "checked" | "unchecked" | "indeterminate";

/** Variant-aware membership: returns true if any encoding of `id`
 *  (raw, base64-encoded, base64-decoded) is present in `checked`.
 *  Magento ships the same logical permission id in different encodings
 *  across `acl_resources` and `role.permissions`; comparing verbatim
 *  silently misses real matches. */
function checkedHasVariant(
  id: string,
  checked: ReadonlySet<string>,
): boolean {
  if (checked.has(id)) return true;
  for (const v of idVariants(id)) {
    if (checked.has(v)) return true;
  }
  return false;
}

function computeCheckState(
  ids: ReadonlyArray<string>,
  checked: ReadonlySet<string>,
): CheckState {
  if (ids.length === 0) return "unchecked";
  let onCount = 0;
  for (const id of ids) if (checkedHasVariant(id, checked)) onCount++;
  if (onCount === 0) return "unchecked";
  if (onCount === ids.length) return "checked";
  return "indeterminate";
}

/** Top-level synthetic "All" row. Mirrors the visual treatment of the
 *  screenshot — the chevron just expand/collapses every group. */
function AllRow({
  state,
  onToggle,
  expanded,
  onToggleExpand,
  children,
}: {
  readonly state: CheckState;
  readonly onToggle: () => void;
  readonly expanded: boolean;
  readonly onToggleExpand: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <li className="m-0 p-0">
      <div className="flex items-center gap-2 py-1">
        <ExpandToggle expanded={expanded} onClick={onToggleExpand} />
        <TristateCheckbox state={state} onChange={onToggle} label="All" />
        <span className="font-semibold">All</span>
      </div>
      <ul className="m-0 p-0 list-none pl-6 border-l border-dashed border-slate-300">
        {children}
      </ul>
    </li>
  );
}

function AclRow({
  node,
  checked,
  expanded,
  onToggleSubtree,
  onToggleExpand,
}: {
  readonly node: CompanyAclResourceNode;
  readonly checked: ReadonlySet<string>;
  readonly expanded: ReadonlySet<string>;
  readonly onToggleSubtree: (ids: ReadonlyArray<string>) => void;
  readonly onToggleExpand: (id: string) => void;
}) {
  const subtreeIds = useMemo(() => collectSubtreeIds(node), [node]);
  if (!node.id) return null;

  const hasChildren = !!node.children?.length;
  const isExpanded = expanded.has(node.id);
  /** Aggregated state across this node + every descendant — drives both
   *  the visual tristate and the cascade-up behaviour ("all children
   *  ticked individually ⇒ parent shows as checked"). */
  const state = computeCheckState(subtreeIds, checked);
  const label = node.text ?? "Permission";

  return (
    <li className="m-0 p-0">
      <div className="flex items-center gap-2 py-1">
        {hasChildren ? (
          <ExpandToggle
            expanded={isExpanded}
            onClick={() => onToggleExpand(node.id!)}
          />
        ) : (
          <span aria-hidden="true" className="inline-block w-5" />
        )}
        <TristateCheckbox
          state={state}
          onChange={() => onToggleSubtree(subtreeIds)}
          label={label}
        />
        <span>{label}</span>
      </div>
      {hasChildren && isExpanded ? (
        <ul className="m-0 p-0 list-none pl-6 border-l border-dashed border-slate-300">
          {node.children!.map((child, idx) => (
            <AclRow
              key={child.id ?? `${node.id}__${idx}`}
              node={child}
              checked={checked}
              expanded={expanded}
              onToggleSubtree={onToggleSubtree}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/* ── Atoms ───────────────────────────────────────────────────── */

function ExpandToggle({
  expanded,
  onClick,
}: {
  readonly expanded: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={expanded ? "Collapse group" : "Expand group"}
      onClick={onClick}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    >
      <svg
        width={10}
        height={10}
        viewBox="0 0 10 10"
        fill="currentColor"
        aria-hidden="true"
        style={{
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 120ms ease",
        }}
      >
        <path d="M3 1.5 L7 5 L3 8.5 Z" />
      </svg>
    </button>
  );
}

/** Native checkbox with imperative `indeterminate` — the only state the
 *  DOM can render that React doesn't expose declaratively. */
function TristateCheckbox({
  state,
  onChange,
  label,
}: {
  readonly state: CheckState;
  readonly onChange: () => void;
  readonly label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "indeterminate";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={state === "checked"}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer accent-theme-primary"
    />
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

/** Ids of every node that has children — the set we use to seed expansion. */
function collectGroupIds(
  resources: ReadonlyArray<CompanyAclResourceNode>,
): string[] {
  const out: string[] = [];
  const walk = (list: ReadonlyArray<CompanyAclResourceNode>) => {
    for (const n of list) {
      if (n.id && n.children?.length) out.push(n.id);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(resources);
  return out;
}
