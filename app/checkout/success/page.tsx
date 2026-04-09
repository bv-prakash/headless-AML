import { Suspense } from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/src/components/common/Breadcrumbs";
import OrderSuccessContent from "@/src/components/checkout/OrderSuccessContent";
import PageLoader from "@/src/components/common/PageLoader";

export const metadata: Metadata = {
  title: "Order complete",
  description: "Thank you for your American Lighting order.",
};

export default function CheckoutSuccessPage() {
  return (
    <div className="container relative mb-[25px] mt-5 lg-custom:mb-7.5! lg-custom:mt-7.5!">
      <Breadcrumbs items={[{ label: "Order confirmation" }]} />
      <h1 className="sr-only">Order confirmation</h1>
      <Suspense
        fallback={
          <PageLoader label="Loading…" minHeightClassName="min-h-[40vh]" />
        }
      >
        <OrderSuccessContent />
      </Suspense>
    </div>
  );
}
