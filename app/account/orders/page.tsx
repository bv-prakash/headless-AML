"use client";

import { useQuery } from "@apollo/client/react";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import { OrdersTable } from "@/src/components/account/OrdersTable";
import PageLoader from "@/src/components/common/PageLoader";
import {
  CUSTOMER_ORDERS_QUERY,
  formatCustomerFirstLast,
  type CustomerOrdersData,
} from "@/src/framework/graphql/queries/customerOrders";
import { getErrorMessage } from "@/src/utils/errors";

export default function MyAccountOrdersPage() {
  const { data, loading, error, refetch } = useQuery<CustomerOrdersData>(CUSTOMER_ORDERS_QUERY, {
    fetchPolicy: "network-only",
  });

  const orders = data?.customer?.orders?.items;
  const createdByDisplay = formatCustomerFirstLast(data?.customer?.firstname, data?.customer?.lastname);

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
        <OrdersTable orders={orders} createdByDisplay={createdByDisplay} />
      ) : null}
    </div>
  );
}
