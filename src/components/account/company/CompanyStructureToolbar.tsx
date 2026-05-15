"use client";

import { memo } from "react";

/**
 * Magento admin's structure widget uses plain text links separated by `|`.
 * Holding the style and ordering here (rather than in the page) keeps the
 * toolbar self-contained — if product asks us to add another action, we
 * change one component.
 */

const LINK =
  "text-sm font-normal text-theme-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline";
const LINK_DANGER =
  "text-sm font-normal text-light-red hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline";

type ToolbarProps = {
  readonly onExpandAll: () => void;
  readonly onCollapseAll: () => void;
  readonly onAddUser: () => void;
  readonly onAddTeam: () => void;
  readonly onEditSelected: () => void;
  readonly onDeleteSelected: () => void;
  readonly canEditSelected: boolean;
  readonly isBusy: boolean;
};

function Separator() {
  /** Single rendered separator — easier to swap (e.g. for an icon) later. */
  return (
    <span aria-hidden="true" className="mx-2 text-gray-400">
      |
    </span>
  );
}

export const CompanyStructureToolbar = memo(function CompanyStructureToolbar({
  onExpandAll,
  onCollapseAll,
  onAddUser,
  onAddTeam,
  onEditSelected,
  onDeleteSelected,
  canEditSelected,
  isBusy,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center mb-4 text-sm">
      <button type="button" className={LINK} onClick={onExpandAll}>
        Expand All
      </button>
      <Separator />
      <button type="button" className={LINK} onClick={onCollapseAll}>
        Collapse All
      </button>
      <Separator />
      <button type="button" className={LINK} onClick={onAddUser}>
        Add User
      </button>
      <Separator />
      <button type="button" className={LINK} onClick={onAddTeam}>
        Add Team
      </button>
      <Separator />
      <button
        type="button"
        className={LINK}
        onClick={onEditSelected}
        disabled={!canEditSelected || isBusy}
      >
        Edit Selected
      </button>
      <Separator />
      <button
        type="button"
        className={LINK_DANGER}
        onClick={onDeleteSelected}
        disabled={!canEditSelected || isBusy}
      >
        {isBusy ? "Deleting…" : "Delete Selected"}
      </button>
    </div>
  );
});
