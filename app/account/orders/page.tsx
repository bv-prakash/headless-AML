import { Suspense } from "react";
import OrdersPageContent from "@/src/components/account/order/OrdersPageContent";
import PageLoader from "@/src/components/common/PageLoader";

export default function MyAccountOrdersPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading orders…" minHeightClassName="min-h-[40vh]" />}>
      <OrdersPageContent />
    </Suspense>
  );
}
