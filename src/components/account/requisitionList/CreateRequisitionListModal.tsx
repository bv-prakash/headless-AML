"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import {
  CREATE_REQUISITION_LIST_MUTATION,
  type CreateRequisitionListResponse,
  type CreateRequisitionListVariables,
} from "@/src/framework/graphql/mutations/requisitionListMutations";
import type { RequisitionListRow } from "@/src/framework/graphql/queries/requisitionLists";
import { getErrorMessage } from "@/src/utils/errors";

type CreateRequisitionListModalProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  /**
   * Called after a successful create. Receives the newly created list so the
   * parent can chain follow-up actions (e.g. move/copy items into it).
   */
  readonly onCreated?: (created: RequisitionListRow) => void;
  /** Optional override for the toast message on success. */
  readonly successToast?: (created: RequisitionListRow) => string;
};

export function CreateRequisitionListModal({
  open,
  onClose,
  onCreated,
  successToast,
}: CreateRequisitionListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [createRequisitionList, { loading }] = useMutation<
    CreateRequisitionListResponse,
    CreateRequisitionListVariables
  >(CREATE_REQUISITION_LIST_MUTATION, {
    /**
     * Refetch active `CustomerRequisitionLists` observers by query name so
     * Apollo reuses each one's current variables (`currentPage` / `pageSize`).
     * Passing the query document with no variables would trigger
     * "Variable '$currentPage' of required type 'Int!' was not provided".
     */
    refetchQueries: ["CustomerRequisitionLists"],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      /** Focus the first field on open. */
      requestAnimationFrame(() => nameInputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error("Name is required.");
        return;
      }
      try {
        const trimmedDescription = description.trim();
        const { data } = await createRequisitionList({
          variables: {
            input: {
              name: trimmedName,
              ...(trimmedDescription ? { description: trimmedDescription } : {}),
            },
          },
        });
        const created = data?.createRequisitionList?.requisition_list;
        if (!created) {
          toast.error("Failed to create requisition list.");
          return;
        }
        toast.success(
          successToast ? successToast(created) : `Requisition list "${created.name}" created.`,
        );
        onCreated?.(created);
        onClose();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to create requisition list."));
      }
    },
    [name, description, createRequisitionList, onCreated, onClose, successToast],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-requisition-list-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white max-w-md w-full rounded shadow-lg">
        <div className="flex items-center justify-between border-b border-f0f0f0 px-5 py-4">
          <h2
            id="create-requisition-list-title"
            className="text-lg font-semibold m-0"
          >
            Create New Requisition List
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            <label
              htmlFor="requisition-list-name"
              className="block text-sm font-bold mb-1"
            >
              Name <span className="text-light-red">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="requisition-list-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full border border-ccc px-3 py-2 leading-tight focus:outline-none focus:border-theme-primary"
            />
          </div>
          <div>
            <label
              htmlFor="requisition-list-description"
              className="block text-sm font-bold mb-1"
            >
              Description
            </label>
            <textarea
              id="requisition-list-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full border border-ccc px-3 py-2 leading-tight focus:outline-none focus:border-theme-primary resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-2 px-4 text-sm font-bold uppercase border border-ccc bg-white text-black hover:bg-f4f4f4 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="py-2 px-4 text-sm font-bold uppercase bg-theme-primary text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
