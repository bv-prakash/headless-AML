"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import {
  UPDATE_REQUISITION_LIST_MUTATION,
  type UpdateRequisitionListResponse,
  type UpdateRequisitionListVariables,
} from "@/src/framework/graphql/requisition-lists/mutations/updateRequisitionList";
import { getErrorMessage } from "@/src/utils/errors";

type RenameRequisitionListModalProps = {
  readonly open: boolean;
  readonly listUid: string;
  readonly initialName: string;
  readonly initialDescription: string | null;
  readonly onClose: () => void;
  readonly onRenamed?: () => void;
};

export function RenameRequisitionListModal({
  open,
  listUid,
  initialName,
  initialDescription,
  onClose,
  onRenamed,
}: RenameRequisitionListModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [updateRequisitionList, { loading }] = useMutation<
    UpdateRequisitionListResponse,
    UpdateRequisitionListVariables
  >(UPDATE_REQUISITION_LIST_MUTATION, {
    refetchQueries: ["CustomerRequisitionLists", "CustomerRequisitionListDetail"],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (open) {
      setName(initialName);
      setDescription(initialDescription ?? "");
      requestAnimationFrame(() => nameInputRef.current?.focus());
    }
  }, [open, initialName, initialDescription]);

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
        const { data } = await updateRequisitionList({
          variables: {
            requisitionListUid: listUid,
            input: {
              name: trimmedName,
              ...(trimmedDescription ? { description: trimmedDescription } : {}),
            },
          },
        });
        const updated = data?.updateRequisitionList?.requisition_list;
        if (!updated) {
          toast.error("Failed to update requisition list.");
          return;
        }
        toast.success(`Requisition list renamed to "${updated.name}".`);
        onRenamed?.();
        onClose();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to update requisition list."));
      }
    },
    [name, description, listUid, updateRequisitionList, onRenamed, onClose],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-requisition-list-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white max-w-md w-full rounded shadow-lg">
        <div className="flex items-center justify-between border-b border-f0f0f0 px-5 py-4">
          <h2 id="rename-requisition-list-title" className="text-lg font-semibold m-0">
            Rename Requisition List
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
            <label htmlFor="rename-requisition-list-name" className="block text-sm font-bold mb-1">
              Name <span className="text-light-red">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="rename-requisition-list-name"
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
              htmlFor="rename-requisition-list-description"
              className="block text-sm font-bold mb-1"
            >
              Description
            </label>
            <textarea
              id="rename-requisition-list-description"
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
