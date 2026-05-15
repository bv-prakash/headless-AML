"use client";

import { memo, useMemo, type CSSProperties, type ReactNode } from "react";
import type { StructureNode } from "@/src/framework/graphql/queries/companyStructure";
import { Chevron, NodeIcon } from "@/src/components/account/company/treeIcons";
import { NodeDetailsTooltip } from "@/src/components/account/company/NodeDetailsTooltip";

type Props = {
  readonly nodes: ReadonlyArray<StructureNode>;
  readonly expanded: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** Logged-in customer's email — used to mark the matching row with `(me)`.
   *  Email-based because Magento's privacy filter nulls `Customer.id`. */
  readonly currentCustomerEmail: string | null;
  /** Company admin's email — used to mark the permanent-root row. Same
   *  email-vs-id rationale. */
  readonly companyAdminEmail: string | null;
};

/**
 * Company structure tree, Magento-admin-style.
 *
 * Visual hierarchy:
 *  - Company admin = permanent root, never collapses, no chevron.
 *  - CompanyTeam   = collapsible group, chip styling + chevron + tinted
 *                    `GroupContainer` wrapping its members.
 *  - Customer      = leaf row (no chevron even if it has children).
 *
 * Connectors are real DOM nodes with Tailwind utilities (one vertical rail
 * per `<ul>` + a short horizontal stub per row), not CSS pseudo-elements —
 * the previous CSS-only approach silently lost connectors under Tailwind v4 +
 * Turbopack's cascade layering.
 */
export const CompanyStructureTree = memo(function CompanyStructureTree({
  nodes,
  expanded,
  onToggle,
  selectedId,
  onSelect,
  currentCustomerEmail,
  companyAdminEmail,
}: Props) {
  /** Lower-case once at the top level so each row doesn't redo it. */
  const meEmail = useMemo(
    () => currentCustomerEmail?.toLowerCase() ?? null,
    [currentCustomerEmail],
  );
  const adminEmail = useMemo(
    () => companyAdminEmail?.toLowerCase() ?? null,
    [companyAdminEmail],
  );

  return (
    <ul className="m-0 p-0 list-none text-sm leading-snug" role="tree">
      {nodes.map((node) => (
        <TreeRow
          key={node.item.id}
          node={node}
          level={1}
          isFirstAtLevel
          expanded={expanded}
          onToggle={onToggle}
          selectedId={selectedId}
          onSelect={onSelect}
          meEmail={meEmail}
          adminEmail={adminEmail}
        />
      ))}
    </ul>
  );
});

/* ── Row ─────────────────────────────────────────────────────── */

type RowProps = {
  readonly node: StructureNode;
  readonly level: number;
  /** Top-level rows skip the horizontal connector stub. */
  readonly isFirstAtLevel?: boolean;
  /** Rows inside a `GroupContainer` skip the stub — the container's
   *  coloured left border acts as the visible connection instead. */
  readonly inGroupContainer?: boolean;
  readonly expanded: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly meEmail: string | null;
  readonly adminEmail: string | null;
};

function TreeRow({
  node,
  level,
  isFirstAtLevel = false,
  inGroupContainer = false,
  expanded,
  onToggle,
  selectedId,
  onSelect,
  meEmail,
  adminEmail,
}: RowProps) {
  const hasChildren = node.children.length > 0;
  const isTeam = node.kind === "team";
  const isSelected = selectedId === node.item.id;

  const userEmail =
    node.kind === "user" && node.item.entity?.__typename === "Customer"
      ? (node.item.entity.email ?? "").toLowerCase()
      : null;
  const isMe = !!userEmail && userEmail === meEmail;
  const isCompanyAdmin = !!userEmail && userEmail === adminEmail;

  const isCollapsible = isTeam;
  const isOpen = isCompanyAdmin
    ? true
    : isCollapsible
      ? expanded.has(node.item.id)
      : hasChildren;

  const handleToggle = () => {
    if (isCollapsible) onToggle(node.item.id);
  };

  const childRowsProps = {
    expanded,
    onToggle,
    selectedId,
    onSelect,
    meEmail,
    adminEmail,
  };

  return (
    <li
      role="treeitem"
      aria-selected={isSelected}
      aria-level={level}
      aria-expanded={isCollapsible ? isOpen : undefined}
      className="relative m-0 p-0"
    >
      <RowAnchor
        node={node}
        isTeam={isTeam}
        isSelected={isSelected}
        isMe={isMe}
        isCompanyAdmin={isCompanyAdmin}
        isCollapsible={isCollapsible}
        isOpen={isOpen}
        onToggle={handleToggle}
        onSelect={() => onSelect(node.item.id)}
        showStub={!isFirstAtLevel && !isCompanyAdmin && !inGroupContainer}
      />

      {isOpen && hasChildren ? (
        isTeam ? (
          <GroupContainer>
            <ChildList variant="bare">
              {node.children.map((child) => (
                <TreeRow
                  key={child.item.id}
                  node={child}
                  level={level + 1}
                  inGroupContainer
                  {...childRowsProps}
                />
              ))}
            </ChildList>
          </GroupContainer>
        ) : (
          <ChildList variant={isCompanyAdmin ? "root" : "default"}>
            {node.children.map((child) => (
              <TreeRow
                key={child.item.id}
                node={child}
                level={level + 1}
                {...childRowsProps}
              />
            ))}
          </ChildList>
        )
      ) : null}

      {isTeam && isOpen && !hasChildren ? (
        <GroupContainer>
          <p className="m-0 px-3 py-1.5 text-xs italic text-slate-500">
            No members yet.
          </p>
        </GroupContainer>
      ) : null}
    </li>
  );
}

/* ── Row anchor ──────────────────────────────────────────────── */

type RowAnchorProps = {
  readonly node: StructureNode;
  readonly isTeam: boolean;
  readonly isSelected: boolean;
  readonly isMe: boolean;
  readonly isCompanyAdmin: boolean;
  readonly isCollapsible: boolean;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly onSelect: () => void;
  readonly showStub: boolean;
};

function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function RowAnchor({
  node,
  isTeam,
  isSelected,
  isMe,
  isCompanyAdmin,
  isCollapsible,
  isOpen,
  onToggle,
  onSelect,
  showStub,
}: RowAnchorProps) {
  const anchorClasses = classNames(
    "inline-flex items-center gap-2 px-2 py-1 rounded-sm min-h-[28px]",
    "border text-current no-underline cursor-pointer select-none whitespace-nowrap",
    isSelected
      ? "bg-slate-200/80 border-slate-400"
      : "border-transparent hover:bg-slate-100",
    isTeam && "bg-sky-50 border-sky-200 font-semibold pr-3",
    isCompanyAdmin && "font-semibold py-1.5",
  );

  const themeIconSize = isCompanyAdmin ? 36 : 18;
  const themeIconStyle: CSSProperties = {
    width: themeIconSize,
    height: themeIconSize,
    flex: `0 0 ${themeIconSize}px`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...(isCompanyAdmin
      ? {
          borderRadius: "50%",
          border: "1.5px solid currentColor",
          opacity: 0.9,
        }
      : { opacity: 0.85 }),
  };

  return (
    <div className="relative inline-flex items-center">
      {showStub ? (
        <span
          aria-hidden="true"
          className="absolute left-[-14px] top-1/2 h-px w-3 bg-slate-300"
        />
      ) : null}

      {isCollapsible ? (
        <button
          type="button"
          aria-label={isOpen ? "Collapse group" : "Expand group"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <Chevron open={isOpen} />
        </button>
      ) : (
        /** Leaf dot — keeps icons aligned with team rows that have a chevron. */
        !isCompanyAdmin && (
          <span
            aria-hidden="true"
            className="mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center"
          >
            <span className="block h-1 w-1 rounded-full bg-slate-400" />
          </span>
        )
      )}

      <a
        // eslint-disable-next-line jsx-a11y/anchor-is-valid -- jstree pattern: `<a>` is the treeitem; href is intentionally inert.
        href="#"
        tabIndex={0}
        className={anchorClasses}
        onClick={(e) => {
          e.preventDefault();
          onSelect();
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          } else if (e.key === "ArrowRight" && isCollapsible && !isOpen) {
            e.preventDefault();
            onToggle();
          } else if (e.key === "ArrowLeft" && isCollapsible && isOpen) {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <span style={themeIconStyle} aria-hidden="true">
          <NodeIcon kind={node.kind} size={isCompanyAdmin ? 22 : 16} />
        </span>
        <span className="leading-tight">{node.label}</span>
        {isMe ? (
          <span className="ml-1 text-xs font-normal text-slate-500">(me)</span>
        ) : null}
        <NodeDetailsTooltip node={node} />
      </a>
    </div>
  );
}

/* ── Containers ──────────────────────────────────────────────── */

/** Tinted box with a coloured left rail, wrapping a team's open members. */
function GroupContainer({ children }: { readonly children: ReactNode }) {
  return (
    <div className="relative my-1.5 ml-4 rounded-md border border-sky-200 border-l-4 border-l-sky-400 bg-sky-50/70 py-1.5 pl-3 pr-2">
      {children}
    </div>
  );
}

/**
 * Vertical rail down the left side of a child list.
 *  - `default` — slate hairline (most lists).
 *  - `root`    — bolder line under the company admin.
 *  - `bare`    — no rail (used inside `GroupContainer`).
 */
function ChildList({
  children,
  variant = "default",
}: {
  readonly children: ReactNode;
  readonly variant?: "default" | "root" | "bare";
}) {
  const isBare = variant === "bare";
  const isRoot = variant === "root";
  return (
    <ul
      className={classNames(
        "relative m-0 list-none",
        isBare ? "ml-0 pl-2" : isRoot ? "ml-4 pl-6" : "ml-2 pl-5",
      )}
      role="group"
    >
      {!isBare ? (
        <span
          aria-hidden="true"
          className={classNames(
            "pointer-events-none absolute top-0 bottom-2 left-1.5 w-px",
            isRoot ? "bg-slate-400" : "bg-slate-300",
          )}
        />
      ) : null}
      {children}
    </ul>
  );
}
