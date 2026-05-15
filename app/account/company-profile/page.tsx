import { Suspense } from "react";
import CompanyProfilePageContent from "@/src/components/account/company/CompanyProfilePageContent";
import PageLoader from "@/src/components/common/PageLoader";

export default function MyAccountCompanyProfilePage() {
  return (
    <Suspense
      fallback={<PageLoader label="Loading company profile…" minHeightClassName="min-h-[40vh]" />}
    >
      <CompanyProfilePageContent />
    </Suspense>
  );
}
