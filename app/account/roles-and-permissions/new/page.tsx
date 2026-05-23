import { Suspense } from "react";
import RoleFormPage from "@/src/components/account/roles-and-permissions/RoleFormPage";
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
      <RoleFormPage mode="create" />
    </Suspense>
  );
}
