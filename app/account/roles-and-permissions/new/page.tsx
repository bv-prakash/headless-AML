import { Suspense } from "react";
import CompanyRoleFormPageContent from "@/src/components/account/company/CompanyRoleFormPageContent";
import PageLoader from "@/src/components/common/PageLoader";

export default function MyAccountAddRolePage() {
  return (
    <Suspense
      fallback={
        <PageLoader
          label="Loading permissions…"
          minHeightClassName="min-h-[40vh]"
        />
      }
    >
      <CompanyRoleFormPageContent mode="create" />
    </Suspense>
  );
}
