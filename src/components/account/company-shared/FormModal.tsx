"use client";

import { useEffect, useId, type FormEvent, type ReactNode } from "react";

type Props = {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly onSubmit: (e: FormEvent) => void;
  /** Disables the submit button — for in-flight mutations or invalid forms. */
  readonly submitDisabled?: boolean;
  /** Disables both buttons during in-flight requests. */
  readonly loading?: boolean;
  readonly submitLabel?: string;
  /** Constrain dialog body width — defaults to `max-w-md`, modals with more
   *  fields can opt into `max-w-lg`. */
  readonly maxWidthClass?: string;
  readonly children: ReactNode;
};

/**
 * Generic dialog + form shell used by the Add/Edit team and user modals.
 *
 * Handles:
 *  - The `role="dialog"` overlay, click-outside-to-close, ESC-to-close.
 *  - Header (title + × button).
 *  - Footer (Cancel + Save buttons with consistent styling).
 *  - `aria-labelledby` wiring via a generated id.
 */
export function FormModal({
  open,
  title,
  onClose,
  onSubmit,
  submitDisabled,
  loading,
  submitLabel = "Save",
  maxWidthClass = "max-w-md",
  children,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white ${maxWidthClass} w-full rounded shadow-lg max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between border-b border-f0f0f0 px-5 py-4 sticky top-0 bg-white">
          <h2 id={titleId} className="text-lg font-semibold m-0">
            {title}
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
        <form onSubmit={onSubmit} className="px-5 py-5 space-y-4">
          {children}
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
              disabled={loading || submitDisabled}
              className="py-2 px-4 text-sm font-bold uppercase bg-theme-primary text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
