import { Suspense } from "react";
import CompanyStructurePageContent from "@/src/components/account/company/CompanyStructurePageContent";
import PageLoader from "@/src/components/common/PageLoader";

export default function MyAccountCompanyStructurePage() {
  return (
    <Suspense
      fallback={
        <PageLoader label="Loading company structure…" minHeightClassName="min-h-[40vh]" />
      }
    >
      <CompanyStructurePageContent />
    </Suspense>
  );
}
