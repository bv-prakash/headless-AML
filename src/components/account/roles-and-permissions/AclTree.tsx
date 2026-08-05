"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collectAllAclIds,
  collectSubtreeIds,
} from "@/src/components/account/roles-and-permissions/aclProjection";
import type { CompanyAclResourceNode } from "@/src/framework/graphql/roles-and-permissions/types";
import { idVariants } from "@/src/framework/graphql/utils/magentoIds";

type Props = {
  readonly resources: ReadonlyArray<CompanyAclResourceNode>;
  readonly checked: ReadonlySet<string>;
  readonly onChange: (next: ReadonlySet<string>) => void;
};

type CheckState = "checked" | "unchecked" | "indeterminate";

/**
 * Hierarchical permissions tree (standard cascading-checkbox UX).
 *
 *  - Clicking a row toggles its **entire subtree** atomically.
 *  - Each row's state aggregates the subtree: all-on → checked, none-on
 *    → unchecked, otherwise indeterminate. So picking each child
 *    individually lights the parent up too.
 *  - The synthetic "All" row at the top is just the same logic applied
 *    to every visible id.
 *
 * Fully controlled — the parent owns the `checked` set.
 */
export const AclTree = memo(function AclTree({
  resources,
  checked,
  onChange,
}: Props) {
  /** Magento ships its ACL tree with a single root labelled "All"; we
   *  render its children directly under our own "All" row to avoid a
   *  duplicate top-level row. */
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

  /** Variant-aware: `checked` may carry both the raw resource code and
   *  its base64 UID, so when flipping off we drop every encoding to
   *  avoid leftover variants making the next render look stuck-on. */
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

/* ── Rows ──────────────────────────────────────────────────── */

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

/* ── Atoms ─────────────────────────────────────────────────── */

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

/** Native checkbox with imperative `indeterminate` — the only tri-state
 *  the DOM exposes but React doesn't expose declaratively. */
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

/* ── Helpers ───────────────────────────────────────────────── */

function isMagentoAllRoot(node: CompanyAclResourceNode): boolean {
  return (
    (node.text ?? "").trim().toLowerCase() === "all"
    && !!node.children?.length
  );
}

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

/** Ids of every node that has children — used to seed expansion. */
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
