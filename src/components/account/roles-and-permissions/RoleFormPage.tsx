"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import PageLoader from "@/src/components/common/PageLoader";
import { getErrorMessage } from "@/src/utils/errors";
import { AclTree } from "@/src/components/account/roles-and-permissions/AclTree";
import {
  collectGrantedPermissionIds,
  permissionIdsToVariantSet,
  projectCheckedToAclIds,
} from "@/src/components/account/roles-and-permissions/aclProjection";
import {
  GET_COMPANY_ACL_RESOURCES_QUERY,
  type GetCompanyAclResourcesResponse,
} from "@/src/framework/graphql/roles-and-permissions/queries/getCompanyAclResources";
import {
  GET_COMPANY_ROLE_QUERY,
  type GetCompanyRoleResponse,
  type GetCompanyRoleVariables,
} from "@/src/framework/graphql/roles-and-permissions/queries/getCompanyRole";
import {
  CREATE_COMPANY_ROLE_MUTATION,
  type CreateCompanyRoleInput,
  type CreateCompanyRoleResponse,
} from "@/src/framework/graphql/roles-and-permissions/mutations/createCompanyRole";
import {
  UPDATE_COMPANY_ROLE_MUTATION,
  type UpdateCompanyRoleInput,
  type UpdateCompanyRoleResponse,
} from "@/src/framework/graphql/roles-and-permissions/mutations/updateCompanyRole";

type Mode = "create" | "edit";

type Props = {
  readonly mode: Mode;
  /** Required for `mode === "edit"`. */
  readonly roleId?: string;
};

const LIST_HREF = "/account/roles-and-permissions";

const PRIMARY_BTN =
  "py-2 px-5 text-sm font-bold uppercase tracking-wide border border-theme-primary bg-theme-primary text-white hover:opacity-90 disabled:opacity-50";
const SECONDARY_BTN =
  "py-2 px-5 text-sm font-bold uppercase tracking-wide border border-ccc bg-white text-black hover:bg-f4f4f4 disabled:opacity-50";
const SECTION_TITLE = "text-xl font-semibold m-0";
const FIELD_CLASS =
  "w-full border border-ccc px-3 py-2 leading-tight focus:outline-none focus:border-theme-primary";

/**
 * Note on refetchQueries: do **not** add `refetchQueries: [...]` to either
 * mutation here. In `create` mode the role-detail `useQuery` is
 * `skip`-ped, but Apollo Client 4 still registers the observable; a
 * name-based refetch would call `refetch()` on it with `{ id: "" }` and
 * Magento responds `Role with id "_id" does not exist.` — a spurious
 * error toast after a successful create. After save we navigate to the
 * list page, which uses `cache-and-network` and refreshes on mount.
 */
export default function RoleFormPage({ mode, roleId }: Props) {
  const router = useRouter();
  const editing = mode === "edit";

  const [name, setName] = useState("");
  const [checked, setChecked] = useState<ReadonlySet<string>>(() => new Set());
  const nameInputRef = useRef<HTMLInputElement>(null);

  const aclQuery = useQuery<GetCompanyAclResourcesResponse>(
    GET_COMPANY_ACL_RESOURCES_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const resources = aclQuery.data?.company?.acl_resources ?? [];

  const detailQuery = useQuery<GetCompanyRoleResponse, GetCompanyRoleVariables>(
    GET_COMPANY_ROLE_QUERY,
    {
      variables: { id: roleId ?? "" },
      skip: !editing || !roleId,
      /** `network-only` guarantees a fresh read after every save —
       *  `cache-first` would otherwise serve pre-save permissions. */
      fetchPolicy: "network-only",
    },
  );

  /** One-shot hydration, guarded by a ref so background refetches don't
   *  clobber edits in progress. We wait for both the ACL master tree
   *  and the role payload to land before seeding. */
  const hydratedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!editing) return;
    const role = detailQuery.data?.company?.role;
    if (!role) return;
    if (resources.length === 0) return;
    if (hydratedRef.current === role.id) return;
    hydratedRef.current = role.id;
    setName(role.name);
    setChecked(
      permissionIdsToVariantSet(collectGrantedPermissionIds(role.permissions)),
    );
  }, [editing, detailQuery.data, resources]);

  useEffect(() => {
    if (!editing) requestAnimationFrame(() => nameInputRef.current?.focus());
  }, [editing]);

  const [createRole, { loading: creating }] = useMutation<
    CreateCompanyRoleResponse,
    { input: CreateCompanyRoleInput }
  >(CREATE_COMPANY_ROLE_MUTATION);
  const [updateRole, { loading: updating }] = useMutation<
    UpdateCompanyRoleResponse,
    { input: UpdateCompanyRoleInput }
  >(UPDATE_COMPANY_ROLE_MUTATION);

  const saving = creating || updating;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error("Role name is required.");
        return;
      }
      const permissions = projectCheckedToAclIds(resources, checked);
      try {
        if (editing && roleId) {
          await updateRole({
            variables: { input: { id: roleId, name: trimmedName, permissions } },
          });
          toast.success(`Role "${trimmedName}" updated.`);
        } else {
          await createRole({
            variables: { input: { name: trimmedName, permissions } },
          });
          toast.success(`Role "${trimmedName}" created.`);
        }
        router.push(LIST_HREF);
      } catch (err) {
        toast.error(
          getErrorMessage(
            err,
            editing ? "Failed to update role." : "Failed to create role.",
          ),
        );
      }
    },
    [name, checked, resources, editing, roleId, createRole, updateRole, router],
  );

  const pageTitle = editing ? "Edit Role" : "Add New Role";

  if (aclQuery.loading && resources.length === 0) {
    return (
      <PageLoader
        label="Loading permissions…"
        minHeightClassName="min-h-[40vh]"
      />
    );
  }
  if (aclQuery.error) {
    return (
      <div className="space-y-3">
        <FormTitle>{pageTitle}</FormTitle>
        <p className="text-light-red m-0" role="alert">
          {getErrorMessage(aclQuery.error, "Could not load permissions.")}
        </p>
      </div>
    );
  }
  if (editing && detailQuery.error) {
    return (
      <div className="space-y-3">
        <FormTitle>{pageTitle}</FormTitle>
        <p className="text-light-red m-0" role="alert">
          {getErrorMessage(detailQuery.error, "Could not load role.")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormTitle>{pageTitle}</FormTitle>

      <section className="space-y-3">
        <h2 className={SECTION_TITLE}>Role Information</h2>
        <div>
          <label
            htmlFor="company-role-name"
            className="block text-sm font-bold mb-1"
          >
            Role Name <span className="text-light-red">*</span>
          </label>
          <input
            ref={nameInputRef}
            id="company-role-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Role Name*"
            required
            maxLength={100}
            className={FIELD_CLASS}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={SECTION_TITLE}>Role Permissions</h2>
        <p className="text-sm text-gray-600 m-0">
          Granting permissions does not affect which features are available
          for your company account. The merchant must enable features to
          make them available for your account.
        </p>
        <AclTree
          resources={resources}
          checked={checked}
          onChange={setChecked}
        />
      </section>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className={PRIMARY_BTN}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <Link href={LIST_HREF} className={SECONDARY_BTN}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function FormTitle({ children }: { readonly children: React.ReactNode }) {
  return (
    <h1 className="text-xl leading-[1.1] mb-5 mt-0 font-semibold md:text-[26px] lg-custom:text-[32px]! lg-custom:mb-7.5! uppercase border-b border-aaa pt-2.5 md:pt-0 pb-[15px]">
      {children}
    </h1>
  );
}
