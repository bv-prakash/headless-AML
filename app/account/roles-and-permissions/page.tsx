import { Suspense } from "react";
import RolesListPage from "@/src/components/account/roles-and-permissions/RolesListPage";
import PageLoader from "@/src/components/common/loader/PageLoader";

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
      <RolesListPage />
    </Suspense>
  );
}
