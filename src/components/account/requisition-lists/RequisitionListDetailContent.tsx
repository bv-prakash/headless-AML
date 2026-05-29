"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import PageLoader from "@/src/components/common/loader/PageLoader";
import { CreateRequisitionListModal } from "@/src/components/account/requisition-lists/CreateRequisitionListModal";
import {
  MoveCopyDropdown,
  type MoveCopyMode,
} from "@/src/components/account/requisition-lists/MoveCopyDropdown";
import { RenameRequisitionListModal } from "@/src/components/account/requisition-lists/RenameRequisitionListModal";
import { RequisitionListItemsTable } from "@/src/components/account/requisition-lists/RequisitionListItemsTable";
import {
  CUSTOMER_REQUISITION_LIST_DETAIL_QUERY,
  type CustomerRequisitionListDetailResponse,
  type CustomerRequisitionListDetailVariables,
} from "@/src/framework/graphql/requisition-lists/queries/getCustomerRequisitionListDetail";
import {
  CUSTOMER_REQUISITION_LISTS_PICKER_QUERY,
  type CustomerRequisitionListsPickerResponse,
} from "@/src/framework/graphql/requisition-lists/queries/getCustomerRequisitionListsPicker";
import type { RequisitionListItem } from "@/src/framework/graphql/requisition-lists/types";
import { formatRequisitionListActivity } from "@/src/components/account/requisition-lists/requisitionListUtils";
import {
  COPY_ITEMS_BETWEEN_REQUISITION_LISTS_MUTATION,
  type CopyItemsBetweenRequisitionListsResponse,
  type CopyItemsBetweenRequisitionListsVariables,
} from "@/src/framework/graphql/requisition-lists/mutations/copyItemsBetweenRequisitionLists";
import {
  DELETE_REQUISITION_LIST_ITEMS_MUTATION,
  type DeleteRequisitionListItemsResponse,
  type DeleteRequisitionListItemsVariables,
} from "@/src/framework/graphql/requisition-lists/mutations/deleteRequisitionListItems";
import {
  DELETE_REQUISITION_LIST_MUTATION,
  type DeleteRequisitionListResponse,
  type DeleteRequisitionListVariables,
} from "@/src/framework/graphql/requisition-lists/mutations/deleteRequisitionList";
import {
  MOVE_ITEMS_BETWEEN_REQUISITION_LISTS_MUTATION,
  type MoveItemsBetweenRequisitionListsResponse,
  type MoveItemsBetweenRequisitionListsVariables,
} from "@/src/framework/graphql/requisition-lists/mutations/moveItemsBetweenRequisitionLists";
import {
  UPDATE_REQUISITION_LIST_ITEMS_MUTATION,
  type UpdateRequisitionListItemsResponse,
  type UpdateRequisitionListItemsVariables,
} from "@/src/framework/graphql/requisition-lists/mutations/updateRequisitionListItems";
import { getErrorMessage } from "@/src/utils/errors";

type RequisitionListDetailContentProps = {
  readonly uid: string;
};

export default function RequisitionListDetailContent({
  uid,
}: RequisitionListDetailContentProps) {
  const router = useRouter();

  const [selectedUids, setSelectedUids] = useState<ReadonlySet<string>>(() => new Set());
  const [removingItemUids, setRemovingItemUids] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [pendingQty, setPendingQty] = useState<ReadonlyMap<string, number>>(
    () => new Map(),
  );
  const [renameOpen, setRenameOpen] = useState(false);
  /**
   * When set, the Create modal is open in "create-then-mass-action" mode:
   * after the new list is created we immediately move/copy the currently
   * selected items into it. `null` means the Create modal isn't open at all.
   */
  const [createForAction, setCreateForAction] = useState<MoveCopyMode | null>(null);

  const { data, loading, error, refetch } = useQuery<
    CustomerRequisitionListDetailResponse,
    CustomerRequisitionListDetailVariables
  >(CUSTOMER_REQUISITION_LIST_DETAIL_QUERY, {
    variables: { uid },
    fetchPolicy: "cache-and-network",
  });

  const { data: pickerData, refetch: refetchPicker } =
    useQuery<CustomerRequisitionListsPickerResponse>(
      CUSTOMER_REQUISITION_LISTS_PICKER_QUERY,
      { fetchPolicy: "cache-and-network" },
    );
  const allLists = pickerData?.customer?.requisition_lists?.items ?? [];

  const list = data?.customer?.requisition_lists?.items?.[0] ?? null;
  const items = useMemo<ReadonlyArray<RequisitionListItem>>(
    () => list?.items?.items ?? [],
    [list],
  );

  /**
   * Drop pending qty edits and stale selections whenever the underlying item
   * set changes (e.g. after refetch). Without this we'd retain qty inputs for
   * items that no longer exist.
   */
  useEffect(() => {
    setPendingQty((prev) => {
      if (prev.size === 0) return prev;
      const validUids = new Set(items.map((i) => i.uid));
      const next = new Map<string, number>();
      let changed = false;
      for (const [k, v] of prev) {
        if (validUids.has(k)) next.set(k, v);
        else changed = true;
      }
      return changed ? next : prev;
    });
    setSelectedUids((prev) => {
      if (prev.size === 0) return prev;
      const validUids = new Set(items.map((i) => i.uid));
      const next = new Set<string>();
      let changed = false;
      for (const k of prev) {
        if (validUids.has(k)) next.add(k);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [items]);

  /* ----------------------------- mutations ----------------------------- */

  const [deleteList, { loading: deletingList }] = useMutation<
    DeleteRequisitionListResponse,
    DeleteRequisitionListVariables
  >(DELETE_REQUISITION_LIST_MUTATION, {
    refetchQueries: ["CustomerRequisitionLists"],
    awaitRefetchQueries: true,
  });

  const [deleteItems] = useMutation<
    DeleteRequisitionListItemsResponse,
    DeleteRequisitionListItemsVariables
  >(DELETE_REQUISITION_LIST_ITEMS_MUTATION);

  const [updateItems, { loading: updatingItems }] = useMutation<
    UpdateRequisitionListItemsResponse,
    UpdateRequisitionListItemsVariables
  >(UPDATE_REQUISITION_LIST_ITEMS_MUTATION);

  const [moveItems, { loading: movingItems }] = useMutation<
    MoveItemsBetweenRequisitionListsResponse,
    MoveItemsBetweenRequisitionListsVariables
  >(MOVE_ITEMS_BETWEEN_REQUISITION_LISTS_MUTATION);

  const [copyItems, { loading: copyingItems }] = useMutation<
    CopyItemsBetweenRequisitionListsResponse,
    CopyItemsBetweenRequisitionListsVariables
  >(COPY_ITEMS_BETWEEN_REQUISITION_LISTS_MUTATION);

  /* ---------------------------- handlers ----------------------------- */

  const handleToggleSelect = useCallback((itemUid: string, checked: boolean) => {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (checked) next.add(itemUid);
      else next.delete(itemUid);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedUids(checked ? new Set(items.map((i) => i.uid)) : new Set());
    },
    [items],
  );

  const handleQtyChange = useCallback(
    (itemUid: string, qty: number) => {
      setPendingQty((prev) => {
        const next = new Map(prev);
        const item = items.find((i) => i.uid === itemUid);
        if (item && item.quantity === qty) {
          /** Editing back to the original drops the pending entry so "Update List" disables again. */
          next.delete(itemUid);
        } else {
          next.set(itemUid, qty);
        }
        return next;
      });
    },
    [items],
  );

  const handleRemoveItem = useCallback(
    async (itemUid: string) => {
      if (!list) return;
      if (!globalThis.confirm("Remove this item from the list?")) return;

      setRemovingItemUids((prev) => {
        const next = new Set(prev);
        next.add(itemUid);
        return next;
      });

      try {
        await deleteItems({
          variables: {
            requisitionListUid: list.uid,
            requisitionListItemUids: [itemUid],
          },
        });
        await refetch();
        toast.success("Item removed.");
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to remove item."));
      } finally {
        setRemovingItemUids((prev) => {
          const next = new Set(prev);
          next.delete(itemUid);
          return next;
        });
      }
    },
    [list, deleteItems, refetch],
  );

  const handleRemoveSelected = useCallback(async () => {
    if (!list || selectedUids.size === 0) return;
    const uids = Array.from(selectedUids);
    if (
      !globalThis.confirm(
        `Remove ${uids.length} item${uids.length === 1 ? "" : "s"} from this list?`,
      )
    ) {
      return;
    }
    setRemovingItemUids((prev) => {
      const next = new Set(prev);
      uids.forEach((u) => next.add(u));
      return next;
    });
    try {
      await deleteItems({
        variables: {
          requisitionListUid: list.uid,
          requisitionListItemUids: uids,
        },
      });
      await refetch();
      setSelectedUids(new Set());
      toast.success(
        `Removed ${uids.length} item${uids.length === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove selected items."));
    } finally {
      setRemovingItemUids((prev) => {
        const next = new Set(prev);
        uids.forEach((u) => next.delete(u));
        return next;
      });
    }
  }, [list, selectedUids, deleteItems, refetch]);

  /**
   * Shared core for both move + copy. Captures the selected uids at call time
   * (so a subsequent refetch can't accidentally clear them mid-flight) and
   * marks them as "removing" while the move mutation runs (move drops them
   * from the source list, mirroring the per-item remove UX).
   */
  const runMassAction = useCallback(
    async (
      mode: MoveCopyMode,
      destinationUid: string,
      destinationName: string,
      itemUids: ReadonlyArray<string>,
    ) => {
      if (!list || itemUids.length === 0) return;
      const sourceUid = list.uid;

      if (mode === "move") {
        setRemovingItemUids((prev) => {
          const next = new Set(prev);
          itemUids.forEach((u) => next.add(u));
          return next;
        });
      }

      try {
        if (mode === "move") {
          await moveItems({
            variables: {
              sourceRequisitionListUid: sourceUid,
              destinationRequisitionListUid: destinationUid,
              requisitionListItemUids: itemUids,
            },
          });
        } else {
          await copyItems({
            variables: {
              sourceRequisitionListUid: sourceUid,
              destinationRequisitionListUid: destinationUid,
              requisitionListItemUids: itemUids,
            },
          });
        }
        /** Refetch the current list (source) and the picker so item counts stay accurate. */
        await Promise.all([refetch(), refetchPicker()]);
        setSelectedUids(new Set());
        toast.success(
          mode === "move"
            ? `Moved ${itemUids.length} item${itemUids.length === 1 ? "" : "s"} to "${destinationName}".`
            : `Copied ${itemUids.length} item${itemUids.length === 1 ? "" : "s"} to "${destinationName}".`,
        );
      } catch (err) {
        toast.error(
          getErrorMessage(
            err,
            mode === "move"
              ? "Failed to move selected items."
              : "Failed to copy selected items.",
          ),
        );
      } finally {
        if (mode === "move") {
          setRemovingItemUids((prev) => {
            const next = new Set(prev);
            itemUids.forEach((u) => next.delete(u));
            return next;
          });
        }
      }
    },
    [list, moveItems, copyItems, refetch, refetchPicker],
  );

  const handlePickExistingDestination = useCallback(
    (mode: MoveCopyMode, destinationUid: string, destinationName: string) => {
      void runMassAction(mode, destinationUid, destinationName, Array.from(selectedUids));
    },
    [runMassAction, selectedUids],
  );

  const handlePickCreateNewDestination = useCallback((mode: MoveCopyMode) => {
    if (selectedUids.size === 0) return;
    setCreateForAction(mode);
  }, [selectedUids]);

  const handleUpdateList = useCallback(async () => {
    if (!list || pendingQty.size === 0) return;
    try {
      const payload = Array.from(pendingQty.entries()).map(([item_id, quantity]) => ({
        item_id,
        quantity,
      }));
      await updateItems({
        variables: {
          requisitionListUid: list.uid,
          requisitionListItems: payload,
        },
      });
      await refetch();
      setPendingQty(new Map());
      toast.success("Requisition list updated.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update requisition list."));
    }
  }, [list, pendingQty, updateItems, refetch]);

  const handleDeleteList = useCallback(async () => {
    if (!list) return;
    if (
      !globalThis.confirm(`Delete requisition list "${list.name}"? This can't be undone.`)
    ) {
      return;
    }
    try {
      const { data: res } = await deleteList({
        variables: { requisitionListUid: list.uid },
      });
      if (!res?.deleteRequisitionList?.status) {
        toast.error("Failed to delete requisition list.");
        return;
      }
      toast.success(`Requisition list "${list.name}" deleted.`);
      router.push("/account/requisition-lists");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete requisition list."));
    }
  }, [list, deleteList, router]);

  /* ----------------------------- render ----------------------------- */

  if (loading && !list) {
    return <PageLoader label="Loading requisition list…" minHeightClassName="min-h-[40vh]" />;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-light-red" role="alert">
          {getErrorMessage(error, "Could not load this requisition list.")}
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

  if (!list) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold m-0">Requisition list not found</h1>
        <p className="text-gray-600">
          The requisition list you&apos;re looking for doesn&apos;t exist or you don&apos;t have
          access to it.
        </p>
        <Link href="/account/requisition-lists" className="inline-block text-theme-primary underline">
          Back to Requisition Lists
        </Link>
      </div>
    );
  }

  const itemCount = items.length;
  const selectedCount = selectedUids.size;
  const hasPendingQty = pendingQty.size > 0;

  return (
    <div className="block-requisition-management space-y-6">
      {/* Title + Rename */}
      <div className="requisition-list-title flex flex-wrap items-center justify-between gap-3 border-b border-aaa pb-4">
        <div className="requisition-controls flex items-center gap-3">
          <h1 className="text-xl m-0 font-semibold md:text-[26px] lg-custom:text-[32px]!">
            {list.name}
          </h1>
          <button
            type="button"
            title="Rename"
            onClick={() => setRenameOpen(true)}
            className="edit py-2 px-4 text-sm font-bold uppercase bg-theme-primary text-white hover:opacity-90 disabled:opacity-50"
          >
            <span>Rename</span>
          </button>
        </div>
        <Link
          href="/account/requisition-lists"
          className="text-sm text-theme-primary hover:underline"
        >
          ← Back to Requisition Lists
        </Link>
      </div>

      {/* Description + meta */}
      {list.description ? (
        <div className="requisition-list-description text-sm text-gray-600">
          {list.description}
        </div>
      ) : null}
      <div className="requisition-info text-sm">
        <span className="counter qty">
          {list.items_count} item{list.items_count === 1 ? "" : "s"}
        </span>
        {list.updated_at ? (
          <span className="text-gray-500 ml-3">
            Last activity {formatRequisitionListActivity(list.updated_at)}
          </span>
        ) : null}
      </div>

      {/* Mass-action toolbar */}
      {itemCount > 0 ? (
        <div className="requisition-toolbar flex flex-wrap items-center gap-3 border-y border-f0f0f0 py-3">
          <div className="requisition-toolbar-select flex items-center gap-2">
            <input
              id="requisition-select-all-toolbar"
              type="checkbox"
              className="input-checkbox"
              checked={selectedCount > 0 && selectedCount === itemCount}
              ref={(el) => {
                if (el)
                  el.indeterminate = selectedCount > 0 && selectedCount < itemCount;
              }}
              onChange={(e) => handleToggleSelectAll(e.target.checked)}
              data-role="select-all"
            />
            <label htmlFor="requisition-select-all-toolbar" className="label text-sm m-0">
              Select all{selectedCount > 0 ? ` (${selectedCount} selected)` : ""}
            </label>
          </div>
          <button
            type="button"
            title="Remove Selected"
            onClick={handleRemoveSelected}
            disabled={selectedCount === 0}
            className="action remove-selected py-2 px-3 text-xs font-bold uppercase border border-ccc bg-white text-light-red hover:bg-f4f4f4 disabled:opacity-50 disabled:hover:bg-white"
          >
            <span>Remove Selected</span>
          </button>
          <MoveCopyDropdown
            mode="move"
            currentListUid={list.uid}
            allLists={allLists}
            disabled={selectedCount === 0}
            busy={movingItems}
            onPickExisting={handlePickExistingDestination}
            onPickCreateNew={handlePickCreateNewDestination}
          />
          <MoveCopyDropdown
            mode="copy"
            currentListUid={list.uid}
            allLists={allLists}
            disabled={selectedCount === 0}
            busy={copyingItems}
            onPickExisting={handlePickExistingDestination}
            onPickCreateNew={handlePickCreateNewDestination}
          />
        </div>
      ) : null}

      {/* Items table */}
      <RequisitionListItemsTable
        items={items}
        selectedUids={selectedUids}
        removingItemUids={removingItemUids}
        pendingQty={pendingQty}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onQtyChange={handleQtyChange}
        onRemoveItem={handleRemoveItem}
      />

      {/* Bottom actions */}
      <div className="actions-toolbar requisition-view-buttons flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-f0f0f0">
        <button
          type="button"
          title="Update List"
          onClick={handleUpdateList}
          disabled={!hasPendingQty || updatingItems}
          className="action primary py-2 px-4 text-sm font-bold uppercase bg-theme-primary text-white hover:opacity-90 disabled:opacity-50"
        >
          {updatingItems ? "Updating…" : "Update List"}
        </button>
        <button
          type="button"
          title="Delete Requisition List"
          onClick={handleDeleteList}
          disabled={deletingList}
          className="action primary delete py-2 px-4 text-sm font-bold uppercase bg-light-red text-white hover:opacity-90 disabled:opacity-50"
        >
          {deletingList ? "Deleting…" : "Delete Requisition List"}
        </button>
      </div>

      {/* Rename modal */}
      <RenameRequisitionListModal
        open={renameOpen}
        listUid={list.uid}
        initialName={list.name}
        initialDescription={list.description}
        onClose={() => setRenameOpen(false)}
        onRenamed={() => void refetch()}
      />

      {/* Create-then-mass-action modal: opened from "Create New Requisition List"
          inside a Move/Copy dropdown. After create succeeds we automatically
          fire the corresponding move/copy mutation against the new list. */}
      <CreateRequisitionListModal
        open={createForAction !== null}
        onClose={() => setCreateForAction(null)}
        successToast={(created) =>
          createForAction === "move"
            ? `Created "${created.name}". Moving selected items…`
            : createForAction === "copy"
              ? `Created "${created.name}". Copying selected items…`
              : `Requisition list "${created.name}" created.`
        }
        onCreated={(created) => {
          const pendingMode = createForAction;
          const uids = Array.from(selectedUids);
          /** Reset before kicking off the chained mutation so React state is settled. */
          setCreateForAction(null);
          if (!pendingMode || uids.length === 0) return;
          void runMassAction(pendingMode, created.uid, created.name, uids);
        }}
      />
    </div>
  );
}
