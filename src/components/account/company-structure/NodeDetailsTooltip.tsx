"use client";

import { useId, useState } from "react";
import type { StructureNode } from "@/src/framework/graphql/company-structure/types";

type DetailRow = { readonly label: string; readonly value: string };

/** Mine non-empty display-worthy fields from the entity union. */
function getNodeDetails(node: StructureNode): ReadonlyArray<DetailRow> {
  const e = node.item.entity;
  if (!e) return [];
  const rows: DetailRow[] = [];
  const push = (label: string, raw: string | null | undefined) => {
    const v = raw?.trim();
    if (v) rows.push({ label, value: v });
  };

  if (e.__typename === "CompanyTeam") {
    push("Description", e.description);
  } else if (e.__typename === "Customer") {
    push("Email", e.email);
    push("Job title", e.job_title);
    push("Telephone", e.telephone);
  }
  return rows;
}

/**
 * Inline info-icon with hover/focus tooltip. Renders nothing when the node
 * has no extra details, so sparse rows stay visually quiet.
 *
 * Accessibility: real `<button>` for keyboard focus; `aria-describedby`
 * links the tooltip when open; `pointer-events-none` on the tooltip body
 * keeps the cursor from getting trapped or flickering when moving off the
 * icon. Click stops propagation so it never selects the row underneath.
 */
export function NodeDetailsTooltip({ node }: { readonly node: StructureNode }) {
  const details = getNodeDetails(node);
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  if (details.length === 0) return null;

  return (
    <span className="relative ml-1 inline-flex items-center">
      <button
        type="button"
        aria-label={`Details for ${node.label}`}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-500 hover:border-slate-500 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        i
      </button>
      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max max-w-xs -translate-x-1/2 rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-xs text-slate-700 shadow-lg"
        >
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {node.label}
          </span>
          <span className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            {details.map((d) => (
              <span key={d.label} className="contents">
                <span className="font-medium text-slate-500">{d.label}</span>
                <span className="wrap-break-word text-slate-800">{d.value}</span>
              </span>
            ))}
          </span>
        </span>
      ) : null}
    </span>
  );
}
