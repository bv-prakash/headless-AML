import dynamic from "next/dynamic";
import { Suspense } from "react";

// Lazy-load Footer with fallback
const FooterComponent = dynamic(() => import("./Footer"), {
  ssr: true,
  loading: () => null, // No fallback - render immediately when ready
});

export function LazyFooter() {
  return (
    <Suspense fallback={null}>
      <FooterComponent />
    </Suspense>
  );
}
