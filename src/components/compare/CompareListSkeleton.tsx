"use client";

/**
 * Stable SSR + first-client paint fallback (matches {@link ClientOnly} default tree).
 */
export function CompareListSkeleton() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
      <div className="h-10 w-10 rounded-full border-[3px] border-gray-200 border-t-theme-primary animate-spin" />
      <span className="sr-only">Loading compare list</span>
    </div>
  );
}
