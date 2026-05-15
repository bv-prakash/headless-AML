import { Suspense } from "react";
import CompanyUsersPageContent from "@/src/components/account/company/CompanyUsersPageContent";
import PageLoader from "@/src/components/common/PageLoader";

export default function MyAccountCompanyUsersPage() {
  return (
    <Suspense
      fallback={
        <PageLoader label="Loading company users…" minHeightClassName="min-h-[40vh]" />
      }
    >
      <CompanyUsersPageContent />
    </Suspense>
  );
}
