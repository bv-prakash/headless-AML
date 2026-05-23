"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import Button from "@/src/components/common/Button";
import { CreateRequisitionListModal } from "@/src/components/account/requisitionList/CreateRequisitionListModal";
import { useClickOutside } from "@/src/hooks/useClickOutside";
import { useAppSelector } from "@/src/store/hooks";
import { getResolvedCartQuantity } from "@/src/store/cartQuantity";
import {
  CUSTOMER_REQUISITION_LISTS_PICKER_QUERY,
  type CustomerRequisitionListsPickerResponse,
} from "@/src/framework/graphql/requisition-lists/queries/getCustomerRequisitionListsPicker";
import type { RequisitionListPickerItem } from "@/src/framework/graphql/requisition-lists/types";
import {
  ADD_PRODUCTS_TO_REQUISITION_LIST_MUTATION,
  type AddProductsToRequisitionListResponse,
  type AddProductsToRequisitionListVariables,
  type RequisitionListItemsInput,
} from "@/src/framework/graphql/requisition-lists/mutations/addProductsToRequisitionList";
import {
  GET_B2B_FEATURES_QUERY,
  type B2BFeaturesResponse,
} from "@/src/framework/graphql/b2b-features/queries/getB2BFeatures";
import { isFeatureEnabled } from "@/src/hooks/useB2BNavGating";
import { getErrorMessage } from "@/src/utils/errors";

type AddToRequisitionListButtonProps = {
  /** Same Redux key the QuantitySelector uses for this product, so we read the live qty. */
  readonly itemKey: string;
  readonly sku: string;
  readonly productName: string;
  readonly disabled?: boolean;
  /**
   * Optional override of the items sent to Magento. Required for product types
   * where the parent SKU alone is ambiguous:
   *  - Configurable: pass `[{ sku, selected_options: [<uid>...] }]`.
   *  - Bundle / Downloadable: include `selected_options`.
   *  - Grouped: one item per child SKU.
   * If omitted, defaults to `[{ sku, quantity }]` (simple / virtual).
   * Return `null` from the callback to short-circuit (e.g. options not all picked).
   * `quantity` here is overridden by the live PDP qty unless the caller sets it.
   *
   * Callers MUST wrap this in `useCallback` — `AddToCartActions` is memoised,
   * passing a fresh function each render defeats that memoisation and causes
   * the lazy-loaded button bundle's render cost on every parent re-render.
   */
  readonly buildItems?: () => ReadonlyArray<RequisitionListItemsInput> | null;
};

export default function AddToRequisitionListButton({
  itemKey,
  sku,
  productName,
  disabled = false,
  buildItems,
}: AddToRequisitionListButtonProps) {
  const router = useRouter();
  const isLoggedIn = useAppSelector((s) => s.auth.isLoggedIn);

  /**
   * Hide the entire button when the store doesn't expose requisition lists.
   * Runs against the same query the sidebar uses, so it's cache-resident after
   * the first page load. Early-return BEFORE other state/queries keeps the
   * mounted-but-disabled case cost-free.
   */
  const { data: storeCfg } = useQuery<B2BFeaturesResponse>(
    GET_B2B_FEATURES_QUERY,
    { fetchPolicy: "cache-first" },
  );
  const featureEnabled = isFeatureEnabled(
    storeCfg?.storeConfig?.is_requisition_list_active,
  );

  /** Narrow selector — only re-renders when *this* product's qty actually changes. */
  const resolvedQty = useAppSelector((s) => getResolvedCartQuantity(s, itemKey));
  const quantity = Math.max(1, Math.floor(Number(resolvedQty ?? 1) || 1));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closePicker = useCallback(() => setPickerOpen(false), []);
  useClickOutside(containerRef, closePicker, pickerOpen);

  /**
   * Lazy-fetch the picker list — only fires when the popover opens, so guest
   * PDP visits don't trigger a "not authorized" customer query.
   */
  const { data: pickerData, loading: pickerLoading } =
    useQuery<CustomerRequisitionListsPickerResponse>(
      CUSTOMER_REQUISITION_LISTS_PICKER_QUERY,
      {
        skip: !pickerOpen || !isLoggedIn,
        fetchPolicy: "cache-and-network",
      },
    );

  const allLists = useMemo<ReadonlyArray<RequisitionListPickerItem>>(
    () => pickerData?.customer?.requisition_lists?.items ?? [],
    [pickerData?.customer?.requisition_lists?.items],
  );

  const [addProducts, { loading: adding }] = useMutation<
    AddProductsToRequisitionListResponse,
    AddProductsToRequisitionListVariables
  >(ADD_PRODUCTS_TO_REQUISITION_LIST_MUTATION, {
    /** Keep the listing page + picker in sync (item_count / updated_at changes). */
    refetchQueries: ["CustomerRequisitionLists", "CustomerRequisitionListsPicker"],
    awaitRefetchQueries: false,
  });

  const addToList = useCallback(
    async (destinationUid: string, destinationName: string) => {
      const customItems = buildItems?.();
      /** Caller signalled "not ready" (e.g. options not all picked). */
      if (customItems === null) {
        toast.error("Please complete product selections first.");
        return;
      }
      const items: ReadonlyArray<RequisitionListItemsInput> =
        customItems && customItems.length > 0
          ? customItems.map((it) => ({ ...it, quantity: it.quantity ?? quantity }))
          : [{ sku, quantity }];

      try {
        const { data } = await addProducts({
          variables: {
            requisitionListUid: destinationUid,
            requisitionListItems: items,
          },
        });
        const updated = data?.addProductsToRequisitionList?.requisition_list;
        if (!updated) {
          toast.error("Failed to add to requisition list.");
          return;
        }
        toast.success(`Added ${productName} to "${destinationName}".`);
        setPickerOpen(false);
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to add to requisition list."));
      }
    },
    [addProducts, sku, quantity, productName, buildItems],
  );

  const handleToggle = useCallback(() => {
    if (!isLoggedIn) {
      toast.error("Please sign in to add items to a requisition list.");
      router.push("/sign-in");
      return;
    }
    setPickerOpen((v) => !v);
  }, [isLoggedIn, router]);

  const handleOpenCreate = useCallback(() => {
    setPickerOpen(false);
    setCreateOpen(true);
  }, []);
  const handleCloseCreate = useCallback(() => setCreateOpen(false), []);
  const handleCreated = useCallback(
    (created: { uid: string; name: string }) => {
      setCreateOpen(false);
      void addToList(created.uid, created.name);
    },
    [addToList],
  );
  const successToast = useCallback(
    (created: { name: string }) => `Created "${created.name}". Adding ${productName}…`,
    [productName],
  );

  if (!featureEnabled) return null;

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        variant="secondary"
        size="icon"
        onClick={handleToggle}
        disabled={disabled}
        loading={adding}
        aria-haspopup="menu"
        aria-expanded={pickerOpen}
        aria-label={`Add ${productName} to Requisition List`}
        title="Add to Requisition List"
      >
        <i className="icon-requisition text-base leading-none" aria-hidden="true" />
      </Button>
      {pickerOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 min-w-[240px] bg-white border border-ccc shadow-lg text-left"
        >
          <div className="px-3 py-2 text-xs font-bold uppercase text-gray-500 border-b border-f0f0f0">
            Add to Requisition List
          </div>
          <ul className="m-0 p-0 list-none max-h-64 overflow-y-auto">
            {pickerLoading && allLists.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">Loading lists…</li>
            ) : allLists.length === 0 ? (
              <li className="px-3 py-2 text-xs text-gray-500">
                You don&apos;t have any requisition lists yet.
              </li>
            ) : (
              allLists.map((l) => (
                <PickerItem
                  key={l.uid}
                  list={l}
                  disabled={adding}
                  onSelect={addToList}
                />
              ))
            )}
            <li className="border-t border-f0f0f0">
              <button
                type="button"
                role="menuitem"
                onClick={handleOpenCreate}
                disabled={adding}
                className="block w-full text-left px-3 py-2 text-sm text-theme-primary hover:bg-f4f4f4 disabled:opacity-50"
              >
                Create New Requisition List
              </button>
            </li>
          </ul>
        </div>
      ) : null}

      <CreateRequisitionListModal
        open={createOpen}
        onClose={handleCloseCreate}
        successToast={successToast}
        onCreated={handleCreated}
      />
    </div>
  );
}

/**
 * Per-list row. Extracted so we can bind a stable `onClick` per row and let
 * React skip re-rendering rows whose `list` identity hasn't changed.
 */
function PickerItem({
  list,
  disabled,
  onSelect,
}: {
  readonly list: RequisitionListPickerItem;
  readonly disabled: boolean;
  readonly onSelect: (uid: string, name: string) => void | Promise<void>;
}) {
  const handleClick = useCallback(
    () => void onSelect(list.uid, list.name),
    [onSelect, list.uid, list.name],
  );
  return (
    <li>
      <button
        type="button"
        role="menuitem"
        onClick={handleClick}
        disabled={disabled}
        className="block w-full text-left px-3 py-2 text-sm hover:bg-f4f4f4 disabled:opacity-50"
      >
        {list.name}
      </button>
    </li>
  );
}
