import { Suspense } from "react";
import RequisitionListsPageContent from "@/src/components/account/requisition-lists/RequisitionListsPageContent";
import PageLoader from "@/src/components/common/loader/PageLoader";

export default function MyAccountRequisitionListsPage() {
  return (
    <Suspense
      fallback={<PageLoader label="Loading requisition lists…" minHeightClassName="min-h-[40vh]" />}
    >
      <RequisitionListsPageContent />
    </Suspense>
  );
}
