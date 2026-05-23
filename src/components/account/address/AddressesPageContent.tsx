"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import { AddressBook } from "@/src/components/account/address/AddressBook";
import { AddressTable } from "@/src/components/account/address/AddressTable";
import { AccountPager } from "@/src/components/common/AccountPager";
import PageLoader from "@/src/components/common/PageLoader";
import { CUSTOMER_INFO_QUERY } from "@/src/framework/graphql/customer/queries/getCustomerInfo";
import type { CustomerForCheckoutResponse } from "@/src/framework/graphql/customer/types";
import {
  buildListPaginationQueryString,
  LUMA_ACCOUNT_LIST_PAGINATION,
  parseListPaginationParams,
  totalPagesFor,
} from "@/src/utils/listPagination";

export default function AddressesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { page, pageSize } = useMemo(
    () => parseListPaginationParams(searchParams, LUMA_ACCOUNT_LIST_PAGINATION),
    [searchParams],
  );

  const { data, loading } = useQuery<CustomerForCheckoutResponse>(CUSTOMER_INFO_QUERY);
  const customer = data?.customer;
  const allAddresses = customer?.addresses ?? [];

  const totalCount = allAddresses.length;
  const totalPages = totalPagesFor(totalCount, pageSize);

  const paginatedAddresses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allAddresses.slice(start, start + pageSize);
  }, [allAddresses, page, pageSize]);

  const rowIndexOffset = (page - 1) * pageSize;

  useEffect(() => {
    if (loading || totalCount <= 0) return;
    if (page > totalPages) {
      router.replace(
        `${pathname}?${buildListPaginationQueryString(totalPages, pageSize, LUMA_ACCOUNT_LIST_PAGINATION)}`,
        { scroll: false },
      );
    }
  }, [loading, totalCount, page, totalPages, pageSize, pathname, router]);

  if (loading && !customer) {
    return <PageLoader label="Loading addresses..." minHeightClassName="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-8">
      <AccountPageTitle />

      <div className="block address-book">
        <div className="block-title font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px] mb-[15px] md:mb-5">
          Default Addresses
        </div>
        <AddressBook addresses={allAddresses} />
      </div>

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
        <AddressTable addresses={paginatedAddresses} rowIndexOffset={rowIndexOffset} />
        <AccountPager totalCount={totalCount} currentPage={page} pageSize={pageSize} />
      </div>
    </div>
  );
}
