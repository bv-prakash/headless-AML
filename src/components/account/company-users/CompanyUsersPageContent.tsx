"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import PageLoader from "@/src/components/common/loader/PageLoader";
import { AccountPager } from "@/src/components/common/navigation/AccountPager";
import { getErrorMessage } from "@/src/utils/errors";
import {
  LUMA_ACCOUNT_LIST_PAGINATION,
  parseListPaginationParams,
  totalPagesFor,
} from "@/src/utils/listPagination";
import {
  GET_COMPANY_USERS_QUERY,
  type CompanyUsersResponse,
  type CompanyUsersVariables,
} from "@/src/framework/graphql/company-users/queries/getCompanyUsers";
import {
  DELETE_COMPANY_USER_MUTATION,
  type DeleteCompanyUserResponse,
} from "@/src/framework/graphql/company-users/mutations/deleteCompanyUser";
import type {
  CompanyUserRow,
  CompanyUserStatus,
} from "@/src/framework/graphql/company-users/types";
import {
  buildEmailToEntityIdMap,
  userDisplayName,
} from "@/src/components/account/company-users/userUtils";
import { CompanyUsersTable } from "@/src/components/account/company-users/CompanyUsersTable";
import { CompanyUserModal } from "@/src/components/account/company-users/CompanyUserModal";
import type { StructureNode } from "@/src/framework/graphql/company-structure/types";

type ViewMode = "active" | "inactive";

/** Carries the user's current role + status alongside the synthetic
 *  `StructureNode` so the edit modal can pre-select them.
 *  `roleName` is the fallback identifier when `roleId` encodings
 *  diverge between `CompanyUser.role.id` and `Company.roles.items[].id`
 *  — see `matchedInitialRoleId` in `CompanyUserModal`. */
type EditingUser = {
  readonly node: StructureNode;
  readonly roleId: string | null;
  readonly roleName: string | null;
  readonly status: CompanyUserStatus;
};

const STATUS_PARAM = "status";

const REFETCH = ["CompanyUsers", "CompanyStructure"];

function parseViewMode(value: string | null): ViewMode {
  return value === "inactive" ? "inactive" : "active";
}

function viewModeToStatus(mode: ViewMode): CompanyUserStatus {
  return mode === "inactive" ? "INACTIVE" : "ACTIVE";
}

/** Build a `StructureNode`-shaped object so we can reuse `CompanyUserModal`
 *  in edit-mode without duplicating its form. The modal reads exactly
 *  these fields: `item.id` (mutation id) + the entity union (form prefill). */
function userRowToStructureNode(
  row: CompanyUserRow,
  entityId: string,
): StructureNode {
  return {
    item: {
      id: entityId,
      parent_id: null,
      entity: {
        __typename: "Customer",
        id: null,
        firstname: row.firstname,
        lastname: row.lastname,
        email: row.email,
        job_title: row.job_title,
        telephone: row.telephone,
      },
    },
    children: [],
    label: userDisplayName(row),
    subtitle: row.job_title || row.email || null,
    kind: "user",
  };
}

export default function CompanyUsersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { page, pageSize } = useMemo(
    () => parseListPaginationParams(searchParams, LUMA_ACCOUNT_LIST_PAGINATION),
    [searchParams],
  );
  const viewMode = parseViewMode(searchParams.get(STATUS_PARAM));

  const variables = useMemo<CompanyUsersVariables>(
    () => ({
      filter: { status: viewModeToStatus(viewMode) },
      currentPage: page,
      pageSize,
    }),
    [viewMode, page, pageSize],
  );

  const { data, loading, error, refetch } = useQuery<
    CompanyUsersResponse,
    CompanyUsersVariables
  >(GET_COMPANY_USERS_QUERY, {
    variables,
    /** `no-cache` like the structure query: `Customer.id` comes back null,
     *  and Apollo's `keyFields: ["id"]` would otherwise merge sibling rows
     *  into a single normalised entry. */
    fetchPolicy: "no-cache",
  });

  const usersBlock = data?.company?.users;
  const rows = usersBlock?.items ?? [];
  const totalCount = usersBlock?.total_count ?? 0;
  const totalPages = totalPagesFor(totalCount, pageSize);
  const roles = data?.company?.roles?.items ?? [];
  const entityIdByEmail = useMemo(() => buildEmailToEntityIdMap(data), [data]);

  /** Out-of-range page recovery — matches the orders page behaviour. */
  useEffect(() => {
    if (loading || totalCount <= 0) return;
    if (page > totalPages) {
      const qs = new URLSearchParams(searchParams.toString());
      qs.set(LUMA_ACCOUNT_LIST_PAGINATION.pageParam, String(totalPages));
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    }
  }, [loading, totalCount, page, totalPages, pageSize, pathname, router, searchParams]);

  /* ── Filter toolbar ─────────────────────────────────────────── */

  const setViewMode = useCallback(
    (next: ViewMode) => {
      const qs = new URLSearchParams(searchParams.toString());
      if (next === "active") qs.delete(STATUS_PARAM);
      else qs.set(STATUS_PARAM, next);
      qs.set(LUMA_ACCOUNT_LIST_PAGINATION.pageParam, "1");
      const qsString = qs.toString();
      router.replace(qsString ? `${pathname}?${qsString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  /* ── Edit modal ─────────────────────────────────────────────── */

  const [editing, setEditing] = useState<EditingUser | null>(null);
  const handleEdit = useCallback(
    (row: CompanyUserRow, entityId: string) => {
      setEditing({
        node: userRowToStructureNode(row, entityId),
        roleId: row.role?.id ?? null,
        roleName: row.role?.name ?? null,
        status: row.status,
      });
    },
    [],
  );
  const closeEdit = useCallback(() => setEditing(null), []);

  /* ── Delete ─────────────────────────────────────────────────── */

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteUser] = useMutation<DeleteCompanyUserResponse>(
    DELETE_COMPANY_USER_MUTATION,
    {
      refetchQueries: REFETCH,
      awaitRefetchQueries: true,
    },
  );

  const handleDelete = useCallback(
    async (row: CompanyUserRow, entityId: string) => {
      const label = userDisplayName(row);
      if (!window.confirm(`Delete user "${label}"?`)) return;
      setDeletingId(entityId);
      try {
        await deleteUser({ variables: { id: entityId } });
        toast.success(`${label} deleted.`);
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to delete user."));
      } finally {
        setDeletingId(null);
      }
    },
    [deleteUser],
  );

  /* ── Render ────────────────────────────────────────────────── */

  if (loading && rows.length === 0) {
    return (
      <PageLoader
        label="Loading company users…"
        minHeightClassName="min-h-[40vh]"
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AccountPageTitle />
        <div className="space-y-3">
          <p className="text-light-red m-0" role="alert">
            {getErrorMessage(error, "Could not load company users.")}
          </p>
          <button
            type="button"
            className="text-sm text-theme-primary underline"
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data?.company) {
    return (
      <div className="space-y-6">
        <AccountPageTitle />
        <p className="text-sm text-gray-600 m-0">
          You are not a member of any company.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AccountPageTitle />

      <FilterToolbar viewMode={viewMode} onChange={setViewMode} />

      <CompanyUsersTable
        rows={rows}
        entityIdByEmail={entityIdByEmail}
        busyRowId={deletingId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AccountPager
        totalCount={totalCount}
        currentPage={page}
        pageSize={pageSize}
      />

      {editing ? (
        <CompanyUserModal
          open
          mode="edit"
          parentId={null}
          user={editing.node}
          roles={roles}
          initialRoleId={editing.roleId}
          initialRoleName={editing.roleName}
          initialStatus={editing.status}
          onClose={closeEdit}
        />
      ) : null}
    </div>
  );
}

/* ── Filter toolbar ────────────────────────────────────────── */

function FilterToolbar({
  viewMode,
  onChange,
}: {
  readonly viewMode: ViewMode;
  readonly onChange: (next: ViewMode) => void;
}) {
  const showingInactive = viewMode === "inactive";
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onChange("inactive")}
        className={`action primary ${showingInactive ? "opacity-50": ""}`}
        aria-pressed={showingInactive}
      >
        Show Inactive Users
      </button>
      <button
        type="button"
        onClick={() => onChange("active")}
        className={`action primary ${!showingInactive ? "opacity-50": ""}`}
        aria-pressed={!showingInactive}
      >
        Show All Users
      </button>
    </div>
  );
}
