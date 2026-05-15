import { Suspense } from "react";
import RequisitionListsPageContent from "@/src/components/account/requisitionList/RequisitionListsPageContent";
import PageLoader from "@/src/components/common/PageLoader";

export default function MyAccountRequisitionListsPage() {
  return (
    <Suspense
      fallback={<PageLoader label="Loading requisition lists…" minHeightClassName="min-h-[40vh]" />}
    >
      <RequisitionListsPageContent />
    </Suspense>
  );
}
