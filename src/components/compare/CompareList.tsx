"use client";

import ClientOnly from "@/src/components/common/ClientOnly";
import { CompareListInner } from "./CompareListInner";
import { CompareListSkeleton } from "./CompareListSkeleton";

export { CompareListSkeleton } from "./CompareListSkeleton";

/**
 * Compare list: deferred until client mount via {@link ClientOnly} so Redux/localStorage
 * and Apollo never run during SSR, avoiding hydration mismatches.
 */
export default function CompareList() {
  return (
    <ClientOnly fallback={<CompareListSkeleton />}>
      <CompareListInner />
    </ClientOnly>
  );
}
