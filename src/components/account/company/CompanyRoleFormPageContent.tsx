"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import PageLoader from "@/src/components/common/PageLoader";
import { getErrorMessage } from "@/src/utils/errors";
import {
  collectGrantedPermissionIds,
  COMPANY_ACL_RESOURCES_QUERY,
  COMPANY_ROLE_DETAIL_QUERY,
  type CompanyAclResourceNode,
  type CompanyAclResourcesResponse,
  type CompanyRoleDetailResponse,
} from "@/src/framework/graphql/queries/companyRoles";
import { idVariants } from "@/src/framework/graphql/utils/magentoIds";
import {
  CREATE_COMPANY_ROLE_MUTATION,
  UPDATE_COMPANY_ROLE_MUTATION,
  type CompanyRoleCreateInput,
  type CompanyRoleUpdateInput,
  type CreateCompanyRoleResponse,
  type UpdateCompanyRoleResponse,
} from "@/src/framework/graphql/mutations/companyRoleMutations";
import { CompanyAclTree } from "@/src/components/account/company/CompanyAclTree";

type Mode = "create" | "edit";

type Props = {
  readonly mode: Mode;
  /** Required for `mode === "edit"`. */
  readonly roleId?: string;
};

/**
 * After save we always navigate back to `/account/roles-and-permissions`.
 * That page mounts `CompanyRolesPageContent` with `fetchPolicy:
 * "cache-and-network"`, so the list refreshes from the network on mount
 * — no `refetchQueries` is needed here.
 *
 * In particular, **do not** include `"CompanyRoleDetail"` in any refetch
 * array on this page: in `create` mode our `useQuery(COMPANY_ROLE_DETAIL_QUERY)`
 * is skipped (`skip: !editing || !roleId`), but Apollo Client 4 still
 * registers the observable. Refetching it by name calls `refetch()` with
 * the stale `{ id: "" }` variables, which Magento answers with
 * `Role with id "_id" does not exist.` — surfacing as a spurious error
 * toast after a successful create.
 */

/**
 * Convert the role's returned permission ids into the `checked` set the
 * tree expects.
 *
 * Magento's `role.permissions` already contains every explicitly-granted
 * node (parents and children alike), so the *only* thing we need to do
 * here is normalise across encodings. `role.permissions[].id` may be a
 * raw resource code while `acl_resources[].id` is a base64 UID (or vice
 * versa); we therefore tick every encoding variant of every returned id
 * so the tree's variant-aware checked-state lookup matches either way.
 *
 * Earlier versions also expanded each returned id to its full subtree
 * in the master ACL tree. That over-checked the form whenever Magento
 * returned a granted parent without its children (the common case for
 * partial grants), which is the bug visible in the screenshots where
 * a `Sales`-only grant rendered with every Sales child also ticked.
 */
function permissionIdsToVariantSet(
  rawIds: ReadonlyArray<string>,
): Set<string> {
  const out = new Set<string>();
  for (const id of rawIds) {
    if (!id) continue;
    out.add(id);
    for (const v of idVariants(id)) out.add(v);
  }
  return out;
}

/** Walk the ACL tree and return the canonical id of every node whose
 *  *subtree* contains at least one checked permission — i.e. the node
 *  itself OR any descendant. Magento's role validator rejects a child
 *  "allow" whose parent is "deny", so the payload must include every
 *  ancestor of every granted leaf, not just the leaves themselves. */
function projectCheckedToAclIds(
  resources: ReadonlyArray<CompanyAclResourceNode>,
  checked: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const isChecked = (id: string): boolean =>
    checked.has(id) || idVariants(id).some((v) => checked.has(v));
  const walk = (node: CompanyAclResourceNode): boolean => {
    let anyDescendantChecked = false;
    if (node.children?.length) {
      for (const c of node.children) {
        if (walk(c)) anyDescendantChecked = true;
      }
    }
    const selfChecked = !!node.id && isChecked(node.id);
    const include = selfChecked || anyDescendantChecked;
    if (include && node.id && !seen.has(node.id)) {
      out.push(node.id);
      seen.add(node.id);
    }
    return include;
  };
  for (const root of resources) walk(root);
  return out;
}

const LIST_HREF = "/account/roles-and-permissions";

const PRIMARY_BTN =
  "py-2 px-5 text-sm font-bold uppercase tracking-wide border border-theme-primary bg-theme-primary text-white hover:opacity-90 disabled:opacity-50";
const SECONDARY_BTN =
  "py-2 px-5 text-sm font-bold uppercase tracking-wide border border-ccc bg-white text-black hover:bg-f4f4f4 disabled:opacity-50";

const SECTION_TITLE = "text-xl font-semibold m-0";
const FIELD_CLASS =
  "w-full border border-ccc px-3 py-2 leading-tight focus:outline-none focus:border-theme-primary";

export default function CompanyRoleFormPageContent({ mode, roleId }: Props) {
  const router = useRouter();
  const editing = mode === "edit";

  const [name, setName] = useState("");
  const [checked, setChecked] = useState<ReadonlySet<string>>(() => new Set());
  const nameInputRef = useRef<HTMLInputElement>(null);

  /* ── Queries ────────────────────────────────────────────────── */

  const aclQuery = useQuery<CompanyAclResourcesResponse>(
    COMPANY_ACL_RESOURCES_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const resources = aclQuery.data?.company?.acl_resources ?? [];

  const detailQuery = useQuery<CompanyRoleDetailResponse, { id: string }>(
    COMPANY_ROLE_DETAIL_QUERY,
    {
      variables: { id: roleId ?? "" },
      skip: !editing || !roleId,
      /** `network-only` to guarantee a fresh read after every save.
       *  Apollo's default `cache-first` would otherwise serve the
       *  pre-save permissions list when the user returns to the
       *  edit page after a successful update. */
      fetchPolicy: "network-only",
    },
  );

  /** One-shot hydration. The ref-keyed guard prevents background
   *  refetches from clobbering in-progress edits.
   *
   *  Both the ACL tree AND the role permissions must have loaded
   *  before we hydrate — without the tree, the user would briefly
   *  see "no permissions" while the tree renders. */
  const hydratedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!editing) return;
    const role = detailQuery.data?.company?.role;
    if (!role) return;
    if (resources.length === 0) return;
    if (hydratedRef.current === role.id) return;
    hydratedRef.current = role.id;
    setName(role.name);
    /** Magento returns `role.permissions` as a **nested tree** of the
     *  actually-granted ACL resource codes. *Every* node in that tree
     *  — parents and leaves alike — is an explicit grant; the matching
     *  mutation input is a flat list that includes both parent codes
     *  and child codes side-by-side. We therefore project the tree
     *  back to that same flat set so every granted node renders as
     *  checked, not just the leaves. */
    const rawPermissionIds = collectGrantedPermissionIds(role.permissions);
    /** Seed the tree's `checked` set with *every encoding variant* of
     *  every returned permission id. We do NOT expand to descendants
     *  in the master ACL tree — Magento returns the exact set of grants
     *  and any extra ticking would over-grant the role on save. */
    const nextChecked = permissionIdsToVariantSet(rawPermissionIds);
    setChecked(nextChecked);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info("[CompanyRoleForm] hydrated role permissions", {
        roleId: role.id,
        roleName: role.name,
        rawPermissionCount: rawPermissionIds.length,
        rawPermissionIds,
        expandedCheckedCount: nextChecked.size,
      });
    }
  }, [editing, detailQuery.data, resources]);

  useEffect(() => {
    if (!editing) requestAnimationFrame(() => nameInputRef.current?.focus());
  }, [editing]);

  /* ── Mutations ──────────────────────────────────────────────── */

  const [createRole, { loading: creating }] = useMutation<
    CreateCompanyRoleResponse,
    { input: CompanyRoleCreateInput }
  >(CREATE_COMPANY_ROLE_MUTATION);

  const [updateRole, { loading: updating }] = useMutation<
    UpdateCompanyRoleResponse,
    { input: CompanyRoleUpdateInput }
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
      /** `checked` may contain encoding variants (raw + base64) seeded
       *  from the backend on edit. Project it down to the canonical
       *  ACL-tree id for each permission that's actually checked, so
       *  the mutation receives one stable id per permission. */
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

  /* ── Render ────────────────────────────────────────────────── */

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
        <CompanyAclTree
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
