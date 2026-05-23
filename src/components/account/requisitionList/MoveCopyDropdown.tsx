"use client";

import { useMemo, useRef, useState } from "react";
import { useClickOutside } from "@/src/hooks/useClickOutside";
import type { RequisitionListPickerItem } from "@/src/framework/graphql/requisition-lists/types";

export type MoveCopyMode = "move" | "copy";

type MoveCopyDropdownProps = {
  readonly mode: MoveCopyMode;
  readonly currentListUid: string;
  readonly allLists: ReadonlyArray<RequisitionListPickerItem>;
  readonly disabled?: boolean;
  readonly busy?: boolean;
  /** Called when an existing destination list is chosen. */
  readonly onPickExisting: (mode: MoveCopyMode, destinationUid: string, destinationName: string) => void;
  /** Called when "Create New Requisition List" is chosen. */
  readonly onPickCreateNew: (mode: MoveCopyMode) => void;
};

const LABEL_BY_MODE: Record<MoveCopyMode, string> = {
  move: "Move Selected",
  copy: "Copy Selected",
};

export function MoveCopyDropdown({
  mode,
  currentListUid,
  allLists,
  disabled,
  busy,
  onPickExisting,
  onPickCreateNew,
}: MoveCopyDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  /** Destinations exclude the current list itself. */
  const otherLists = useMemo(
    () => allLists.filter((l) => l.uid !== currentListUid),
    [allLists, currentListUid],
  );

  const label = LABEL_BY_MODE[mode];
  const buttonLabel = busy ? `${mode === "move" ? "Moving" : "Copying"}…` : label;

  return (
    <div
      ref={containerRef}
      className="requisition-list-action relative inline-block"
    >
      <button
        type="button"
        title={label}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || busy}
        aria-haspopup="menu"
        aria-expanded={open}
        className="action requisition-list-button toggle change py-2 px-3 text-xs font-bold uppercase border border-ccc bg-white text-black hover:bg-f4f4f4 disabled:opacity-50 disabled:hover:bg-white"
      >
        <span>{buttonLabel}</span>
        <span aria-hidden className="ml-1">▾</span>
      </button>
      {open ? (
        <div
          className="items absolute right-0 z-40 mt-1 min-w-[220px] bg-white border border-ccc shadow-lg"
          role="menu"
        >
          <ul className="list-items m-0 p-0 list-none max-h-64 overflow-y-auto">
            {otherLists.length === 0 ? (
              <li className="px-3 py-2 text-xs text-gray-500">
                No other lists yet.
              </li>
            ) : (
              otherLists.map((l) => (
                <li key={l.uid} className="item">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onPickExisting(mode, l.uid, l.name);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-f4f4f4"
                  >
                    {l.name}
                  </button>
                </li>
              ))
            )}
            <li className="item border-t border-f0f0f0">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onPickCreateNew(mode);
                }}
                className="action new block w-full text-left px-3 py-2 text-sm text-theme-primary hover:bg-f4f4f4"
                title="Create New Requisition List"
              >
                <span>Create New Requisition List</span>
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
