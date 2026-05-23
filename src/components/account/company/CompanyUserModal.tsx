"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/src/utils/errors";
import {
  CREATE_COMPANY_USER_MUTATION,
  type CreateCompanyUserInput,
  type CreateCompanyUserResponse,
} from "@/src/framework/graphql/company-users/mutations/createCompanyUser";
import {
  UPDATE_COMPANY_USER_MUTATION,
  type UpdateCompanyUserInput,
  type UpdateCompanyUserResponse,
} from "@/src/framework/graphql/company-users/mutations/updateCompanyUser";
import type { CompanyUserStatus } from "@/src/framework/graphql/company-users/types";
import type {
  CompanyRoleSummary,
  CompanyStructureUserEntity,
  StructureNode,
} from "@/src/framework/graphql/company-structure/types";
import { toMagentoUid } from "@/src/framework/graphql/utils/magentoIds";
import { FormModal } from "@/src/components/account/company/FormModal";
import { SelectField, TextField } from "@/src/components/account/company/FormFields";

type Props = {
  readonly open: boolean;
  readonly mode: "create" | "edit";
  /** Parent team id for create-mode. Null = company root. */
  readonly parentId: string | null;
  /** Existing user node for edit-mode. */
  readonly user: StructureNode | null;
  /** Role list from the Company query — populates the role dropdown. */
  readonly roles: ReadonlyArray<CompanyRoleSummary>;
  /** Pre-selected role id for edit-mode. Callers that have the user's
   *  current role (e.g. the Company Users page) should pass it so the
   *  dropdown opens with the right value selected. Callers that don't
   *  (the structure page) leave it undefined and the user re-picks. */
  readonly initialRoleId?: string | null;
  /** Pre-selected role name — used as a fallback identifier when the id
   *  encoding shipped on `CompanyUser.role.id` doesn't match the id
   *  encoding shipped on `Company.roles.items[].id`. Names are stable
   *  across both paths, so this fallback always works when the role
   *  still exists in the dropdown. */
  readonly initialRoleName?: string | null;
  /** Pre-selected status for edit-mode. Same rationale as `initialRoleId`. */
  readonly initialStatus?: CompanyUserStatus | null;
  readonly onClose: () => void;
};

const REFETCH = ["CompanyStructure"];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
] as const;

/** Sentinel value used in the role dropdown when the user's current role
 *  can't be matched to an option (different id encoding, missing in the
 *  `Company.roles` list, etc.). On submit we strip `role_id` from the
 *  update payload so Magento keeps the existing role. */
const KEEP_CURRENT_ROLE = "__keep_current_role__";

/** Normalise an incoming status value into the strict union. Anything
 *  other than `"INACTIVE"` (case-insensitive) is treated as `"ACTIVE"`,
 *  which matches Magento's "default to active on missing/unknown". */
function normaliseStatus(
  value: CompanyUserStatus | null | undefined,
): CompanyUserStatus {
  return typeof value === "string" && value.toUpperCase() === "INACTIVE"
    ? "INACTIVE"
    : "ACTIVE";
}

export function CompanyUserModal({
  open,
  mode,
  parentId,
  user,
  roles,
  initialRoleId,
  initialRoleName,
  initialStatus,
  onClose,
}: Props) {
  const editing = mode === "edit";
  const existing =
    editing && user?.item.entity?.__typename === "Customer"
      ? (user.item.entity as CompanyStructureUserEntity)
      : null;

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [telephone, setTelephone] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [status, setStatus] = useState<CompanyUserStatus>("ACTIVE");
  const firstnameInputRef = useRef<HTMLInputElement>(null);

  /**
   * Resolve the option id to seed the role `<select>` with on edit.
   *
   * Magento ships role ids in different encodings across endpoints
   * (`CompanyUser.role.id` is the raw integer, `Company.roles.items[].id`
   * is the base64 UID). The `<select value=…>` only matches when the
   * value equals one of the `<option value=…>` strings exactly, so we
   * try three strategies in order:
   *
   *   1. Exact match on `initialRoleId`.
   *   2. Normalise both sides through `toMagentoUid` (covers the raw-
   *      int vs base64 mismatch).
   *   3. Fall back to a case-insensitive name match. Role names are
   *      stable across all storefront B2B endpoints, so this catches
   *      any future encoding the resolver might introduce.
   */
  const matchedInitialRoleId = useMemo(() => {
    if (roles.length === 0) return "";
    if (initialRoleId) {
      const direct = roles.find((r) => r.id === initialRoleId);
      if (direct) return direct.id;
      const targetUid = toMagentoUid(initialRoleId);
      if (targetUid) {
        const byUid = roles.find((r) => toMagentoUid(r.id) === targetUid);
        if (byUid) return byUid.id;
      }
    }
    const wanted = initialRoleName?.trim().toLowerCase();
    if (wanted) {
      const byName = roles.find((r) => r.name.trim().toLowerCase() === wanted);
      if (byName) return byName.id;
    }
    return "";
  }, [initialRoleId, initialRoleName, roles]);

  /**
   * One-shot dev-only diagnostic — only logs when the caller asked us to
   * pre-select a role but neither id-normalisation nor name-matching
   * landed on an option. Surfaces the underlying interop problem (usually
   * a `role: null` from the storefront resolver) without polluting prod
   * console output.
   */
  const diagnosedRef = useRef<string | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!open || !editing) return;
    if (!initialRoleId && !initialRoleName) return;
    if (matchedInitialRoleId) return;
    if (roles.length === 0) return;
    const key = `${initialRoleId ?? ""}|${initialRoleName ?? ""}`;
    if (diagnosedRef.current === key) return;
    diagnosedRef.current = key;
    // eslint-disable-next-line no-console
    console.warn(
      "[CompanyUserModal] Could not pre-select role on edit.",
      {
        initialRoleId,
        initialRoleName,
        availableRoles: roles.map((r) => ({ id: r.id, name: r.name })),
      },
    );
  }, [open, editing, initialRoleId, initialRoleName, matchedInitialRoleId, roles]);

  /** Final value to seed the role `<select>` with.
   *  Order of preference:
   *    1. The id of the option that matched (best — exact, normalised, or by name).
   *    2. `KEEP_CURRENT_ROLE` sentinel when we have a role *name* but no
   *       match — `roleOptions` below injects a synthetic option with this
   *       value labelled with the role's name so the dropdown shows it.
   *    3. Empty string — falls through to the placeholder ("Select a role…"). */
  const seedRoleId = matchedInitialRoleId
    || (editing && initialRoleName ? KEEP_CURRENT_ROLE : "");

  useEffect(() => {
    if (!open) return;
    setFirstname(existing?.firstname ?? "");
    setLastname(existing?.lastname ?? "");
    setEmail(existing?.email ?? "");
    setJobTitle(existing?.job_title ?? "");
    setTelephone(existing?.telephone ?? "");
    setRoleId(seedRoleId);
    setStatus(normaliseStatus(initialStatus));
    requestAnimationFrame(() => firstnameInputRef.current?.focus());
  }, [
    open,
    existing?.id,
    existing?.firstname,
    existing?.lastname,
    existing?.email,
    existing?.job_title,
    existing?.telephone,
    seedRoleId,
    initialStatus,
  ]);

  const [createUser, { loading: creating }] = useMutation<
    CreateCompanyUserResponse,
    { input: CreateCompanyUserInput }
  >(CREATE_COMPANY_USER_MUTATION, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });
  const [updateUser, { loading: updating }] = useMutation<
    UpdateCompanyUserResponse,
    { input: UpdateCompanyUserInput }
  >(UPDATE_COMPANY_USER_MUTATION, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });

  const loading = creating || updating;

  /** Dropdown options. When editing and the user's current role couldn't
   *  be matched to one of the loaded `roles`, inject a synthetic option
   *  at the top labelled with the role's name so the dropdown opens with
   *  it visibly selected. The `KEEP_CURRENT_ROLE` sentinel is stripped
   *  from the mutation payload below. */
  const roleOptions = useMemo(() => {
    const base = roles.map((r) => ({ value: r.id, label: r.name }));
    if (editing && initialRoleName && !matchedInitialRoleId) {
      base.unshift({ value: KEEP_CURRENT_ROLE, label: initialRoleName });
    }
    return base;
  }, [roles, editing, initialRoleName, matchedInitialRoleId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const f = firstname.trim();
      const l = lastname.trim();
      const em = email.trim();
      const job = jobTitle.trim();
      const tel = telephone.trim();
      if (!f || !l || !em || !job || !tel) {
        toast.error("All fields are required.");
        return;
      }
      if (!editing && !roleId) {
        toast.error("Please select a role.");
        return;
      }
      try {
        if (editing && user && existing) {
          /** Use `item.id` (wrapping `CompanyStructureItem.id`), not
           *  `entity.id`. The latter is null due to Magento's privacy
           *  filter — see the file header on COMPANY_STRUCTURE_QUERY. */
          const userId = user.item.id;
          if (!userId) {
            toast.error("Cannot edit this user — missing id. Refresh and try again.");
            return;
          }
          await updateUser({
            variables: {
              input: {
                id: userId,
                firstname: f,
                lastname: l,
                email: em,
                job_title: job,
                telephone: tel,
                /** Strip the `KEEP_CURRENT_ROLE` sentinel — Magento keeps
                 *  the existing role when `role_id` is omitted. */
                ...(roleId && roleId !== KEEP_CURRENT_ROLE
                  ? { role_id: roleId }
                  : {}),
                status,
              },
            },
          });
          toast.success(`User "${f} ${l}" updated.`);
        } else {
          await createUser({
            variables: {
              input: {
                firstname: f,
                lastname: l,
                email: em,
                job_title: job,
                telephone: tel,
                role_id: roleId,
                status,
                ...(parentId ? { target_id: parentId } : {}),
              },
            },
          });
          toast.success(`User "${f} ${l}" created.`);
        }
        onClose();
      } catch (err) {
        toast.error(
          getErrorMessage(err, editing ? "Failed to update user." : "Failed to create user."),
        );
      }
    },
    [
      firstname,
      lastname,
      email,
      jobTitle,
      telephone,
      roleId,
      status,
      editing,
      existing,
      user,
      parentId,
      createUser,
      updateUser,
      onClose,
    ],
  );

  return (
    <FormModal
      open={open}
      title={editing ? "Edit User" : "Add User"}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidthClass="max-w-lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          ref={firstnameInputRef}
          id="company-user-firstname"
          label="First Name"
          required
          value={firstname}
          onChange={setFirstname}
          maxLength={50}
        />
        <TextField
          id="company-user-lastname"
          label="Last Name"
          required
          value={lastname}
          onChange={setLastname}
          maxLength={50}
        />
      </div>
      <TextField
        id="company-user-email"
        label="Email"
        type="email"
        required
        value={email}
        onChange={setEmail}
        maxLength={120}
        autoComplete="email"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          id="company-user-job"
          label="Job Title"
          required
          value={jobTitle}
          onChange={setJobTitle}
          maxLength={50}
        />
        <TextField
          id="company-user-telephone"
          label="Telephone"
          type="tel"
          required
          value={telephone}
          onChange={setTelephone}
          maxLength={20}
          autoComplete="tel"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SelectField
          id="company-user-role"
          label="Role"
          required={!editing}
          value={roleId}
          onChange={setRoleId}
          options={roleOptions}
          placeholder={editing ? undefined : "Select a role…"}
        />
        <SelectField
          id="company-user-status"
          label="Status"
          required
          value={status}
          onChange={(v) => setStatus(v as CompanyUserStatus)}
          options={STATUS_OPTIONS as ReadonlyArray<{ value: string; label: string }>}
        />
      </div>
    </FormModal>
  );
}
