"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import PageLoader from "@/src/components/common/PageLoader";
import { getErrorMessage } from "@/src/utils/errors";
import {
  GET_COMPANY_STRUCTURE_QUERY,
  type CompanyStructureResponse,
} from "@/src/framework/graphql/company-structure/queries/getCompanyStructure";
import type { StructureNode } from "@/src/framework/graphql/company-structure/types";
import { buildStructureTree } from "@/src/components/account/company-structure/structureTree";
import { toMagentoUid } from "@/src/framework/graphql/utils/magentoIds";
import {
  DELETE_COMPANY_TEAM_MUTATION,
  type DeleteCompanyTeamResponse,
} from "@/src/framework/graphql/company-structure/mutations/deleteCompanyTeam";
import {
  DELETE_COMPANY_USER_MUTATION,
  type DeleteCompanyUserResponse,
} from "@/src/framework/graphql/company-users/mutations/deleteCompanyUser";
import { CompanyStructureTree } from "@/src/components/account/company/CompanyStructureTree";
import { CompanyStructureToolbar } from "@/src/components/account/company/CompanyStructureToolbar";
import { CompanyTeamModal } from "@/src/components/account/company/CompanyTeamModal";
import { CompanyUserModal } from "@/src/components/account/company/CompanyUserModal";
import {
  collectTeamIds,
  indexNodes,
  indexParents,
} from "@/src/components/account/company/treeUtils";

const BLOCK_TITLE_CLASS =
  "block-title font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px] mb-[15px] md:mb-5";

const REFETCH = ["CompanyStructure"];

type ModalState =
  | { readonly kind: "add-team"; readonly parentId: string | null }
  | { readonly kind: "edit-team"; readonly node: StructureNode }
  | { readonly kind: "add-user"; readonly parentId: string | null }
  | { readonly kind: "edit-user"; readonly node: StructureNode }
  | null;

/**
 * Resolve the `target_id` for a create mutation.
 *
 * `createCompanyTeam` / `createCompanyUser` expect the parent's
 * `company_structure` row id (the same value the stock storefront submits
 * via `data-tree-id`), base64-encoded. For leaf nodes (no inferred
 * structure id of their own) we walk up to the nearest ancestor that
 * has one.
 */
function resolveCreateTargetId(
  selected: StructureNode | null,
  nodesById: ReadonlyMap<string, StructureNode>,
  parentByChild: ReadonlyMap<string, string | null>,
): string | null {
  if (!selected) return null;

  const walk = (node: StructureNode | null): string | null => {
    if (!node) return null;
    if (node.item.structure_id) return toMagentoUid(node.item.structure_id);
    const parentId = parentByChild.get(node.item.id);
    return parentId ? walk(nodesById.get(parentId) ?? null) : null;
  };
  return walk(selected);
}

export default function CompanyStructurePageContent() {
  const { data, loading, error, refetch } = useQuery<CompanyStructureResponse>(
    GET_COMPANY_STRUCTURE_QUERY,
    {
      /** `no-cache`: Magento returns `Customer.id = null` for every user
       *  in the structure, and our Apollo `Customer: { keyFields: ["id"] }`
       *  policy would otherwise collapse all sibling users into one cache
       *  entry. Mutations refetch the network query, so this is safe. */
      fetchPolicy: "no-cache",
    },
  );

  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  /** Seed expand state once, on the first successful load — subsequent
   *  refetches keep the user's manual collapse state. */
  const expandedSeededRef = useRef(false);

  /* ── Derived ───────────────────────────────────────────────── */

  const items = data?.company?.structure?.items ?? [];
  const tree = useMemo(() => buildStructureTree(items), [items]);
  const groupIds = useMemo(() => collectTeamIds(tree), [tree]);
  const nodesById = useMemo(() => indexNodes(tree), [tree]);
  const parentByChild = useMemo(() => indexParents(tree), [tree]);

  const selectedNode = selectedId ? nodesById.get(selectedId) ?? null : null;
  const roles = data?.company?.roles?.items ?? [];
  const currentCustomerEmail = data?.customer?.email ?? null;
  const companyAdminEmail = data?.company?.company_admin?.email ?? null;

  useEffect(() => {
    if (expandedSeededRef.current || !data) return;
    setExpanded(new Set(groupIds));
    expandedSeededRef.current = true;
  }, [data, groupIds]);

  /* ── Tree state handlers ───────────────────────────────────── */

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setExpanded(new Set(groupIds)), [groupIds]);
  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  /* ── Toolbar actions ───────────────────────────────────────── */

  const resolveParentForCreate = useCallback(
    () => resolveCreateTargetId(selectedNode, nodesById, parentByChild),
    [selectedNode, nodesById, parentByChild],
  );

  const openAddTeam = useCallback(() => {
    setModal({ kind: "add-team", parentId: resolveParentForCreate() });
  }, [resolveParentForCreate]);

  const openAddUser = useCallback(() => {
    setModal({ kind: "add-user", parentId: resolveParentForCreate() });
  }, [resolveParentForCreate]);

  const openEditSelected = useCallback(() => {
    if (!selectedNode) return;
    if (selectedNode.kind === "team") {
      setModal({ kind: "edit-team", node: selectedNode });
    } else if (selectedNode.kind === "user") {
      setModal({ kind: "edit-user", node: selectedNode });
    }
  }, [selectedNode]);

  const closeModal = useCallback(() => setModal(null), []);

  /* ── Delete ─────────────────────────────────────────────────── */

  const [deleteTeam, { loading: deletingTeam }] = useMutation<
    DeleteCompanyTeamResponse
  >(DELETE_COMPANY_TEAM_MUTATION, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });
  const [deleteUser, { loading: deletingUser }] = useMutation<
    DeleteCompanyUserResponse
  >(DELETE_COMPANY_USER_MUTATION, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedNode) return;
    const { label, kind, item } = selectedNode;
    if (!window.confirm(`Delete ${kind === "team" ? "team" : "user"} "${label}"?`)) {
      return;
    }
    try {
      /** `item.id` is the base64 entity-id UID for both teams (`company_team`)
       *  and users (`customer`) — exactly what both delete mutations want. */
      if (kind === "team") {
        await deleteTeam({ variables: { id: item.id } });
      } else if (kind === "user") {
        await deleteUser({ variables: { id: item.id } });
      }
      toast.success(`${label} deleted.`);
      setSelectedId(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete."));
    }
  }, [selectedNode, deleteTeam, deleteUser]);

  /* ── Render ────────────────────────────────────────────────── */

  if (loading && !data) {
    return <PageLoader label="Loading company structure…" minHeightClassName="min-h-[40vh]" />;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <AccountPageTitle />
        <p className="text-light-red text-sm m-0" role="alert">
          {getErrorMessage(error, "Could not load company structure.")}
        </p>
        <button
          type="button"
          className="text-sm text-theme-primary underline"
          onClick={() => void refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data?.company) {
    return (
      <div className="space-y-3">
        <AccountPageTitle />
        <p className="text-sm text-gray-600 m-0">
          You are not a member of any company.
        </p>
      </div>
    );
  }

  const canEditSelected =
    !!selectedNode &&
    (selectedNode.kind === "team" || selectedNode.kind === "user");
  const isBusy = deletingTeam || deletingUser;

  return (
    <div className="space-y-3">
      <AccountPageTitle />

      <div className="block company-structure mb-12.5">
        <div className={BLOCK_TITLE_CLASS}>
          Company Structure
          <span className="text-xs font-normal text-gray-500 ml-2 align-middle">
            ({items.length} {items.length === 1 ? "node" : "nodes"})
          </span>
        </div>

        <CompanyStructureToolbar
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          onAddUser={openAddUser}
          onAddTeam={openAddTeam}
          onEditSelected={openEditSelected}
          onDeleteSelected={handleDeleteSelected}
          canEditSelected={canEditSelected}
          isBusy={isBusy}
        />

        {selectedNode ? (
          <p className="text-xs text-gray-600 m-0 mb-3">
            Selected: <strong>{selectedNode.label}</strong>{" "}
            <button
              type="button"
              className="text-theme-primary hover:underline ml-1"
              onClick={() => setSelectedId(null)}
            >
              clear
            </button>
          </p>
        ) : (
          <p className="text-xs text-gray-600 m-0 mb-3">
            Select a row to edit or delete. New items attach under the selected team
            (or the company root if nothing is selected).
          </p>
        )}

        <div className="border border-f0f0f0 p-3 overflow-x-auto">
          {tree.length === 0 ? (
            <p className="text-sm text-gray-600 m-0 p-3">
              No company structure yet. Start by adding a team or user.
            </p>
          ) : (
            <CompanyStructureTree
              nodes={tree}
              expanded={expanded}
              onToggle={toggleExpand}
              selectedId={selectedId}
              onSelect={setSelectedId}
              currentCustomerEmail={currentCustomerEmail}
              companyAdminEmail={companyAdminEmail}
            />
          )}
        </div>
      </div>

      {(modal?.kind === "add-team" || modal?.kind === "edit-team") && (
        <CompanyTeamModal
          open
          mode={modal.kind === "add-team" ? "create" : "edit"}
          parentId={modal.kind === "add-team" ? modal.parentId : null}
          team={modal.kind === "edit-team" ? modal.node : null}
          onClose={closeModal}
        />
      )}
      {(modal?.kind === "add-user" || modal?.kind === "edit-user") && (
        <CompanyUserModal
          open
          mode={modal.kind === "add-user" ? "create" : "edit"}
          parentId={modal.kind === "add-user" ? modal.parentId : null}
          user={modal.kind === "edit-user" ? modal.node : null}
          roles={roles}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
