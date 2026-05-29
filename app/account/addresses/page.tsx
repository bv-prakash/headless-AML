import { Suspense } from "react";
import AddressesPageContent from "@/src/components/account/address/AddressesPageContent";
import PageLoader from "@/src/components/common/loader/PageLoader";

export default function MyAccountAddressesPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading addresses..." minHeightClassName="min-h-[50vh]" />}>
      <AddressesPageContent />
    </Suspense>
  );
}
