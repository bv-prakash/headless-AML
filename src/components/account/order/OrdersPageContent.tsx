"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import { OrdersTable } from "@/src/components/account/order/OrdersTable";
import { AccountPager } from "@/src/components/common/AccountPager";
import PageLoader from "@/src/components/common/PageLoader";
import {
  CUSTOMER_ORDERS_QUERY,
  formatCustomerFirstLast,
  type CustomerOrdersData,
  type CustomerOrdersVariables,
} from "@/src/framework/graphql/queries/customerOrders";
import { getErrorMessage } from "@/src/utils/errors";
import {
  buildListPaginationQueryString,
  LUMA_ACCOUNT_LIST_PAGINATION,
  parseListPaginationParams,
  totalPagesFor,
} from "@/src/utils/listPagination";

export default function OrdersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { page, pageSize } = useMemo(
    () => parseListPaginationParams(searchParams, LUMA_ACCOUNT_LIST_PAGINATION),
    [searchParams],
  );

  const variables = useMemo<CustomerOrdersVariables>(
    () => ({ currentPage: page, pageSize }),
    [page, pageSize],
  );

  const { data, loading, error, refetch } = useQuery<CustomerOrdersData, CustomerOrdersVariables>(
    CUSTOMER_ORDERS_QUERY,
    {
      variables,
      fetchPolicy: "network-only",
    },
  );

  const orders = data?.customer?.orders?.items;
  const totalCount = data?.customer?.orders?.total_count ?? 0;
  const createdByDisplay = formatCustomerFirstLast(data?.customer?.firstname, data?.customer?.lastname);

  const totalPages = totalPagesFor(totalCount, pageSize);

  useEffect(() => {
    if (loading || totalCount <= 0) return;
    if (page > totalPages) {
      router.replace(
        `${pathname}?${buildListPaginationQueryString(totalPages, pageSize, LUMA_ACCOUNT_LIST_PAGINATION)}`,
        { scroll: false },
      );
    }
  }, [loading, totalCount, page, totalPages, pageSize, pathname, router]);

  return (
    <div className="space-y-6">
      <AccountPageTitle />

      {loading && !orders?.length ? (
        <PageLoader label="Loading orders…" minHeightClassName="min-h-[40vh]" />
      ) : null}

      {error ? (
        <div className="space-y-3">
          <p className="text-light-red" role="alert">
            {getErrorMessage(error, "Could not load your orders.")}
          </p>
          <button
            type="button"
            className="text-sm text-theme-primary underline"
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <OrdersTable orders={orders} createdByDisplay={createdByDisplay} />
          <AccountPager totalCount={totalCount} currentPage={page} pageSize={pageSize} />
        </>
      ) : null}
    </div>
  );
}
