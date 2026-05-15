"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import { AccountPager } from "@/src/components/common/AccountPager";
import PageLoader from "@/src/components/common/PageLoader";
import { getErrorMessage } from "@/src/utils/errors";
import {
  buildListPaginationQueryString,
  LUMA_ACCOUNT_LIST_PAGINATION,
  parseListPaginationParams,
  totalPagesFor,
} from "@/src/utils/listPagination";
import {
  collectGrantedPermissionIds,
  COMPANY_ROLES_QUERY,
  type CompanyRoleListItem,
  type CompanyRolesResponse,
  type CompanyRolesVariables,
} from "@/src/framework/graphql/queries/companyRoles";
import {
  CREATE_COMPANY_ROLE_MUTATION,
  DELETE_COMPANY_ROLE_MUTATION,
  type CompanyRoleCreateInput,
  type CreateCompanyRoleResponse,
  type DeleteCompanyRoleResponse,
} from "@/src/framework/graphql/mutations/companyRoleMutations";
import { CompanyRolesTable } from "@/src/components/account/company/CompanyRolesTable";

const REFETCH = ["CompanyRoles"];

const ADD_NEW_HREF = "/account/roles-and-permissions/new";

const PRIMARY_BTN =
  "inline-block py-2 px-5 text-sm font-bold uppercase tracking-wide border border-theme-primary bg-white text-theme-primary hover:bg-theme-primary hover:text-white transition-colors";

function editHrefFor(roleId: string): string {
  return `/account/roles-and-permissions/edit/${encodeURIComponent(roleId)}`;
}

/** Extract the actually-granted permission ids from a role.
 *
 *  Magento returns `role.permissions` as a nested tree where every
 *  node is an explicit grant; the matching `createCompanyRole`
 *  mutation takes a flat list of those same ids. We project the
 *  tree back to that flat set so the duplicated role inherits the
 *  exact same permissions as the source. */
function permissionIds(role: CompanyRoleListItem): string[] {
  return collectGrantedPermissionIds(role.permissions);
}

export default function CompanyRolesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { page, pageSize } = useMemo(
    () => parseListPaginationParams(searchParams, LUMA_ACCOUNT_LIST_PAGINATION),
    [searchParams],
  );

  const variables = useMemo<CompanyRolesVariables>(
    () => ({ currentPage: page, pageSize }),
    [page, pageSize],
  );

  const { data, loading, error, refetch } = useQuery<
    CompanyRolesResponse,
    CompanyRolesVariables
  >(COMPANY_ROLES_QUERY, {
    variables,
    fetchPolicy: "cache-and-network",
  });

  const rolesBlock = data?.company?.roles;
  const rows = rolesBlock?.items ?? [];
  const totalCount = rolesBlock?.total_count ?? 0;
  const totalPages = totalPagesFor(totalCount, pageSize);

  useEffect(() => {
    if (loading || totalCount <= 0) return;
    if (page > totalPages) {
      router.replace(
        `${pathname}?${buildListPaginationQueryString(totalPages, pageSize, LUMA_ACCOUNT_LIST_PAGINATION)}`,
        { scroll: false },
      );
    }
  }, [loading, totalCount, page, totalPages, pageSize, pathname, router]);

  /* ── Mutations ──────────────────────────────────────────────── */

  const [busyRoleId, setBusyRoleId] = useState<string | null>(null);

  const [createRole] = useMutation<
    CreateCompanyRoleResponse,
    { input: CompanyRoleCreateInput }
  >(CREATE_COMPANY_ROLE_MUTATION, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });

  const [deleteRole] = useMutation<DeleteCompanyRoleResponse>(
    DELETE_COMPANY_ROLE_MUTATION,
    {
      refetchQueries: REFETCH,
      awaitRefetchQueries: true,
    },
  );

  const handleDuplicate = useCallback(
    async (role: CompanyRoleListItem) => {
      setBusyRoleId(role.id);
      try {
        await createRole({
          variables: {
            input: {
              name: `${role.name} - Duplicate`,
              permissions: permissionIds(role),
            },
          },
        });
        toast.success(`Role "${role.name}" duplicated.`);
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to duplicate role."));
      } finally {
        setBusyRoleId(null);
      }
    },
    [createRole],
  );

  const handleDelete = useCallback(
    async (role: CompanyRoleListItem) => {
      if (!window.confirm(`Delete role "${role.name}"?`)) return;
      setBusyRoleId(role.id);
      try {
        await deleteRole({ variables: { id: role.id } });
        toast.success(`Role "${role.name}" deleted.`);
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to delete role."));
      } finally {
        setBusyRoleId(null);
      }
    },
    [deleteRole],
  );

  /* ── Render ────────────────────────────────────────────────── */

  if (loading && rows.length === 0) {
    return (
      <PageLoader
        label="Loading roles…"
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
            {getErrorMessage(error, "Could not load roles.")}
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

      <CompanyRolesTable
        rows={rows}
        busyRoleId={busyRoleId}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        editHref={editHrefFor}
      />

      <p className="text-sm text-gray-600 m-0">
        {totalCount} {totalCount === 1 ? "Item" : "Items"}
      </p>

      <AccountPager
        totalCount={totalCount}
        currentPage={page}
        pageSize={pageSize}
      />

      <div>
        <Link href={ADD_NEW_HREF} className={PRIMARY_BTN}>
          Add New Role
        </Link>
      </div>
    </div>
  );
}
