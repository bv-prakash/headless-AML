"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import { AddressBook } from "@/src/components/account/AddressBook";
import { AddressTable } from "@/src/components/account/AddressTable";
import PageLoader from "@/src/components/common/PageLoader";
import { CUSTOMER_INFO_QUERY } from "@/src/framework/graphql/queries";
import type { CustomerForCheckoutResponse } from "@/src/framework/graphql/queries/customerInfo";

export default function MyAccountAddressesPage() {
  const { data, loading } = useQuery<CustomerForCheckoutResponse>(CUSTOMER_INFO_QUERY);
  const customer = data?.customer;

  if (loading) {
    return <PageLoader label="Loading addresses..." minHeightClassName="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-8">
      <AccountPageTitle />
      
      {/* Default Addresses Section */}
      <div className="block address-book">
        <div className="block-title font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px] mb-[15px] md:mb-5">
          Default Addresses
        </div>
        <AddressBook addresses={customer?.addresses} />
      </div>

      {/* All Addresses Section */}
      <div className="block address-list">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-[15px] md:mb-5">
          <div className="block-title font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px] m-0">
            Additional Address Entries
          </div>
          <Link
            href="/account/addresses/new"
            className="inline-block py-2 px-4 text-sm font-bold uppercase bg-theme-primary text-white no-underline hover:opacity-90"
          >
            Add New Address
          </Link>
        </div>
        <AddressTable addresses={customer?.addresses} />
      </div>
    </div>
  );
}

