import { Suspense } from "react";
import CompanyRolesPageContent from "@/src/components/account/company/CompanyRolesPageContent";
import PageLoader from "@/src/components/common/PageLoader";

export default function MyAccountRolesPage() {
  return (
    <Suspense
      fallback={
        <PageLoader
          label="Loading roles…"
          minHeightClassName="min-h-[40vh]"
        />
      }
    >
      <CompanyRolesPageContent />
    </Suspense>
  );
}
