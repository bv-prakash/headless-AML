"use client";

import { memo } from "react";
import {
  userDisplayName,
  type CompanyUserRow,
} from "@/src/framework/graphql/queries/companyUsers";

type Props = {
  readonly rows: ReadonlyArray<CompanyUserRow>;
  /** Resolved entity id by lower-case email — comes from
   *  `buildEmailToEntityIdMap`. Used to enable/disable per-row edit
   *  and delete since `CompanyUser.id` is null in the response. */
  readonly entityIdByEmail: ReadonlyMap<string, string>;
  readonly busyRowId: string | null;
  readonly onEdit: (row: CompanyUserRow, entityId: string) => void;
  readonly onDelete: (row: CompanyUserRow, entityId: string) => void;
};

const TH =
  "px-5 py-3.5 text-left font-bold uppercase align-bottom text-xs tracking-wide";
const TD = "p-5 align-middle";
const ICON_BTN =
  "inline-flex h-8 w-8 items-center justify-center border border-ccc rounded-sm hover:bg-f4f4f4 disabled:opacity-40 disabled:cursor-not-allowed";

function emailKey(row: CompanyUserRow): string | null {
  return row.email?.trim().toLowerCase() || null;
}

function CompanyUsersTableComponent({
  rows,
  entityIdByEmail,
  busyRowId,
  onEdit,
  onDelete,
}: Props) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 m-0">No company users to show.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="data table w-full border-collapse border border-aaa">
        <caption className="sr-only">Company users</caption>
        <thead>
          <tr className="bg-f0f0f0 border-b-2 border-aaa">
            <th scope="col" className={TH}>ID</th>
            <th scope="col" className={TH}>Name</th>
            <th scope="col" className={TH}>Email</th>
            <th scope="col" className={TH}>Role</th>
            <th scope="col" className={TH}>Team</th>
            <th scope="col" className={TH}>Status</th>
            <th scope="col" className={`${TH} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <UserRow
              key={emailKey(row) ?? `${idx}`}
              row={row}
              entityId={(emailKey(row) && entityIdByEmail.get(emailKey(row)!)) || null}
              busy={
                !!busyRowId &&
                busyRowId === (emailKey(row) ? entityIdByEmail.get(emailKey(row)!) ?? null : null)
              }
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const UserRow = memo(function UserRow({
  row,
  entityId,
  busy,
  onEdit,
  onDelete,
}: {
  readonly row: CompanyUserRow;
  readonly entityId: string | null;
  readonly busy: boolean;
  readonly onEdit: (row: CompanyUserRow, entityId: string) => void;
  readonly onDelete: (row: CompanyUserRow, entityId: string) => void;
}) {
  const isInactive = row.status === "INACTIVE";
  const rowClass = `border-b border-ccc ${isInactive ? "text-gray-500" : ""} hover:bg-f4f4f4`;
  const canMutate = !!entityId && !busy;

  const displayId = entityId ? decodeIdForDisplay(entityId) : "—";

  return (
    <tr className={rowClass}>
      <td data-th="ID" className={TD}>{displayId}</td>
      <td data-th="Name" className={TD}>{userDisplayName(row)}</td>
      <td data-th="Email" className={TD}>{row.email ?? "—"}</td>
      <td data-th="Role" className={TD}>{row.role?.name ?? "—"}</td>
      <td data-th="Team" className={TD}>{row.team?.name ?? "—"}</td>
      <td data-th="Status" className={TD}>
        <StatusBadge status={row.status} />
      </td>
      <td data-th="Actions" className={`${TD} text-right whitespace-nowrap`}>
        <button
          type="button"
          aria-label={`Edit ${userDisplayName(row)}`}
          title={
            entityId
              ? "Edit user"
              : "Missing id — refresh the page or check role permissions"
          }
          onClick={() => entityId && onEdit(row, entityId)}
          disabled={!canMutate}
          className={`${ICON_BTN} mr-2 text-slate-600 hover:text-theme-primary`}
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          aria-label={`Delete ${userDisplayName(row)}`}
          title={entityId ? "Delete user" : "Missing id — cannot delete"}
          onClick={() => entityId && onDelete(row, entityId)}
          disabled={!canMutate}
          className={`${ICON_BTN} text-slate-600 hover:text-light-red`}
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
});
UserRow.displayName = "UserRow";

/** Coloured pill matching the Magento admin status column. */
function StatusBadge({ status }: { readonly status: "ACTIVE" | "INACTIVE" }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${
        isActive
          ? "bg-green-100 text-light-green"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

/** Decode a base64 UID for display purposes (the admin shows the raw
 *  numeric `entity_id`). Falls back to the encoded value on failure. */
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

export const CompanyUsersTable = memo(CompanyUsersTableComponent);
CompanyUsersTable.displayName = "CompanyUsersTable";
