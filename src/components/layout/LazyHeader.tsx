import dynamic from "next/dynamic";
import { Suspense } from "react";

// Lazy-load Header with fallback
const HeaderComponent = dynamic(() => import("./Header"), {
  ssr: true,
  loading: () => null, // No fallback - render immediately when ready
});

export function LazyHeader() {
  return (
    <Suspense fallback={null}>
      <HeaderComponent />
    </Suspense>
  );
}
