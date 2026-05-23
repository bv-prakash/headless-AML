"use client";

import Link from "next/link";
import { memo } from "react";
import type { CompanyRoleListItem } from "@/src/framework/graphql/roles-and-permissions/types";

type Props = {
  readonly rows: ReadonlyArray<CompanyRoleListItem>;
  readonly busyRoleId: string | null;
  readonly onDuplicate: (role: CompanyRoleListItem) => void;
  readonly onDelete: (role: CompanyRoleListItem) => void;
  /** Build the edit URL for a given role id. */
  readonly editHref: (roleId: string) => string;
};

const TH =
  "px-5 py-3.5 text-left font-bold uppercase align-bottom text-xs tracking-wide";
const TD = "p-5 align-middle";
const ICON_BTN =
  "inline-flex h-8 w-8 items-center justify-center border border-ccc rounded-sm hover:bg-f4f4f4 disabled:opacity-40 disabled:cursor-not-allowed";

export const RolesTable = memo(function RolesTable({
  rows,
  busyRoleId,
  onDuplicate,
  onDelete,
  editHref,
}: Props) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 m-0">No roles to show.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto w-full">
      <table className="data table w-full border-collapse border border-aaa">
        <caption className="sr-only">Roles and permissions</caption>
        <thead>
          <tr className="bg-f0f0f0 border-b-2 border-aaa">
            <th scope="col" className={TH}>ID</th>
            <th scope="col" className={TH}>Role</th>
            <th scope="col" className={TH}>Users</th>
            <th scope="col" className={`${TH} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RoleRow
              key={row.id}
              role={row}
              busy={busyRoleId === row.id}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              editHref={editHref}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});
RolesTable.displayName = "RolesTable";

const RoleRow = memo(function RoleRow({
  role,
  busy,
  onDuplicate,
  onDelete,
  editHref,
}: {
  readonly role: CompanyRoleListItem;
  readonly busy: boolean;
  readonly onDuplicate: (role: CompanyRoleListItem) => void;
  readonly onDelete: (role: CompanyRoleListItem) => void;
  readonly editHref: (roleId: string) => string;
}) {
  const displayId = decodeIdForDisplay(role.id);
  const canMutate = !busy;
  return (
    <tr className="border-b border-ccc hover:bg-f4f4f4">
      <td data-th="ID" className={TD}>{displayId}</td>
      <td data-th="Role" className={TD}>
        <Link
          href={editHref(role.id)}
          className="text-theme-primary hover:underline"
        >
          {role.name}
        </Link>
      </td>
      <td data-th="Users" className={TD}>{role.users_count ?? 0}</td>
      <td data-th="Actions" className={`${TD} text-right whitespace-nowrap`}>
        <button
          type="button"
          aria-label={`Duplicate ${role.name}`}
          title="Duplicate role"
          onClick={() => onDuplicate(role)}
          disabled={!canMutate}
          className={`${ICON_BTN} mr-2 text-slate-600 hover:text-theme-primary`}
        >
          <CopyIcon />
        </button>
        <Link
          href={editHref(role.id)}
          aria-label={`Edit ${role.name}`}
          title="Edit role"
          className={`${ICON_BTN} mr-2 text-slate-600 hover:text-theme-primary`}
        >
          <PencilIcon />
        </Link>
        <button
          type="button"
          aria-label={`Delete ${role.name}`}
          title="Delete role"
          onClick={() => onDelete(role)}
          disabled={!canMutate}
          className={`${ICON_BTN} text-slate-600 hover:text-light-red`}
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
});
RoleRow.displayName = "RoleRow";

/** Magento ships role ids as base64 UIDs in the storefront; decode to
 *  the raw integer for the admin-matching "ID" column. */
function decodeIdForDisplay(uid: string): string {
  if (!uid) return "—";
  try {
    const decoded =
      typeof atob === "function"
        ? atob(uid)
        : Buffer.from(uid, "base64").toString("utf-8");
    return /^\d+$/.test(decoded) ? decoded : uid;
  } catch {
    return uid;
  }
}

function CopyIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x={9} y={9} width={13} height={13} rx={2} ry={2} />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6 17.5 20a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
