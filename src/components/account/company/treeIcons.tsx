import type { CSSProperties } from "react";
import type { StructureNode } from "@/src/framework/graphql/queries/companyStructure";

/** Rotating triangle used by team rows' expand/collapse toggle. */
export function Chevron({ open }: { readonly open: boolean }) {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 10 10"
      fill="currentColor"
      aria-hidden="true"
      style={{
        width: 10,
        height: 10,
        display: "block",
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 120ms ease",
      }}
    >
      <path d="M3 1.5 L7 5 L3 8.5 Z" />
    </svg>
  );
}

/**
 * Theme icon for the row.
 *
 * SVGs carry explicit `width`/`height` HTML attributes (which outrank CSS for
 * replaced elements) and an inline `style`, so the icons can never balloon
 * from Tailwind v4's `svg { display: block }` preflight regardless of which
 * CSS layers load.
 */
export function NodeIcon({
  kind,
  size = 16,
}: {
  readonly kind: StructureNode["kind"];
  readonly size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor" as const,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { width: size, height: size, display: "block" } as CSSProperties,
    "aria-hidden": true,
  };

  if (kind === "team") {
    return (
      <svg {...common}>
        <circle cx={9} cy={8} r={3.2} />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <circle cx={17} cy={9} r={2.4} />
        <path d="M14.5 20a4.5 4.5 0 0 1 6.5-4" />
      </svg>
    );
  }
  if (kind === "user") {
    return (
      <svg {...common}>
        <circle cx={12} cy={8} r={4} />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#ccc",
        display: "inline-block",
      }}
    />
  );
}
