"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { CUSTOMER_DASHBOARD_RECENT_ORDERS_QUERY } from "@/src/framework/graphql/customer-orders/queries/getDashboardRecentOrders";
import type {
  CustomerDashboardRecentOrderItem,
  CustomerDashboardRecentOrdersData,
} from "@/src/framework/graphql/customer-orders/types";
import {
  formatOrderDateShort,
  formatOrderMoney,
  orderDisplayId,
  orderRowCreatedByDisplay,
} from "@/src/components/account/orders/orderFormat";
import { getErrorMessage } from "@/src/utils/errors";

const TH = "px-4 py-3 text-left font-bold uppercase bg-f0f0f0 border-b-2 border-aaa";
const TD = "px-4 py-3 border-b border-aaa";

export function DashboardRecentOrders() {
  const { data, loading, error, refetch } = useQuery<CustomerDashboardRecentOrdersData>(
    CUSTOMER_DASHBOARD_RECENT_ORDERS_QUERY,
    { fetchPolicy: "network-only" },
  );

  const customer = data?.customer;
  const orders = customer?.orders?.items ?? [];
  const accountFirst = customer?.firstname;
  const accountLast = customer?.lastname;

  return (
    <div className="block block-dashboard-orders mb-12.5">
      <div className="block-title order flex flex-wrap items-center justify-between gap-3 font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px] mb-[15px] md:mb-5">
        <strong>Recent Orders</strong>
        <Link
          href="/account/orders"
          className="action view icon-view-order text-theme-primary hover:underline text-sm font-normal md:text-base"
        >
          <span>View All</span>
        </Link>
      </div>
      <div className="block-content">
        {loading && !orders.length ? (
          <p className="text-sm text-gray-600 m-0">Loading recent orders…</p>
        ) : null}

        {error ? (
          <div className="space-y-2">
            <p className="text-light-red text-sm m-0" role="alert">
              {getErrorMessage(error, "Could not load recent orders.")}
            </p>
            <button type="button" className="text-sm text-theme-primary underline" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : null}

        {!loading && !error && orders.length === 0 ? (
          <p className="text-sm text-gray-600 m-0">You have placed no orders.</p>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <div className="table-wrapper orders-recent overflow-x-auto w-full">
            <table
              className="data table table-order-items recent w-full border-collapse border border-aaa"
              id="my-orders-table"
            >
              <caption className="table-caption sr-only">Recent Orders</caption>
              <thead>
                <tr>
                  <th scope="col" className={`col id ${TH}`}>
                    Order#
                  </th>
                  <th scope="col" className={`col date ${TH}`}>
                    Date
                  </th>
                  <th scope="col" className={`col shipping ${TH}`}>
                    Created By
                  </th>
                  <th scope="col" className={`col total ${TH}`}>
                    Order Total
                  </th>
                  <th scope="col" className={`col status ${TH}`}>
                    Status
                  </th>
                  <th scope="col" className={`col actions ${TH} text-center`}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: CustomerDashboardRecentOrderItem, idx: number) => {
                  const href = `/account/orders/${encodeURIComponent(order.number)}`;
                  const createdBy = orderRowCreatedByDisplay(order, accountFirst, accountLast);
                  const total = formatOrderMoney(order.total?.grand_total ?? null);
                  return (
                    <tr key={order.id || `${order.number}-${idx}`}>
                      <td data-th="Order #" className={`col id ${TD}`}>
                        {orderDisplayId(order)}
                      </td>
                      <td data-th="Date" className={`col date ${TD}`}>
                        {formatOrderDateShort(order.order_date)}
                      </td>
                      <td data-th="Created By" className={`col shipping ${TD}`}>
                        {createdBy}
                      </td>
                      <td data-th="Order Total" className={`col total ${TD}`}>
                        <span className="price">{total}</span>
                      </td>
                      <td data-th="Status" className={`col status ${TD} capitalize`}>
                        {order.status ? order.status.replace(/_/g, " ") : "—"}
                      </td>
                      <td data-th="Action" className={`col actions ${TD} text-start`}>
                        <Link href={href} className="action view text-theme-primary hover:underline">
                          <span>View Order</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
