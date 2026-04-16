"use client";

import React, { useMemo, memo } from "react";
import Link from "next/link";
import type { CustomerOrderListItem } from "@/src/framework/graphql/queries/customerOrders";
import {
  formatOrderDateShort,
  formatOrderMoney,
  orderDisplayId,
  orderPoNumber,
} from "@/src/framework/graphql/queries/customerOrders";

type OrdersTableProps = {
  orders?: readonly CustomerOrderListItem[] | null;
  /** From `customer { firstname lastname }` on the orders query (logged-in account). */
  createdByDisplay?: string;
};

const STATUS_BADGE =
  "inline-block px-2 py-1 rounded text-xs font-medium capitalize";
const STATUS_COMPLETE = "bg-green-100 text-green-800";
const STATUS_CANCELLED = "bg-red-100 text-red-800";
const STATUS_DEFAULT = "bg-yellow-100 text-yellow-800";

function statusClass(status: string | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s === "complete" || s === "closed") return `${STATUS_BADGE} ${STATUS_COMPLETE}`;
  if (s === "canceled" || s === "cancelled") return `${STATUS_BADGE} ${STATUS_CANCELLED}`;
  return `${STATUS_BADGE} ${STATUS_DEFAULT}`;
}

const EmptyState = memo(function EmptyState() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">You have placed no orders.</p>
    </div>
  );
});
EmptyState.displayName = "EmptyState";

const OrderRow = memo(function OrderRow({
  order,
  createdByDisplay,
}: {
  order: CustomerOrderListItem;
  createdByDisplay: string;
}) {
  const href = `/account/orders/${encodeURIComponent(order.number)}`;
  const total = formatOrderMoney(order.total?.grand_total ?? null);
  return (
    <tr>
      <td data-th="ID" className="col id px-4 py-3 text-sm border-b border-ccc">
        {orderDisplayId(order)}
      </td>
      <td data-th="PO number" className="col po-number px-4 py-3 text-sm border-b border-ccc">
        {orderPoNumber(order)}
      </td>
      <td data-th="Order #" className="col oracle-id px-4 py-3 text-sm border-b border-ccc">
        <Link href={href} className="text-theme-primary hover:underline">
          {order.number}
        </Link>
      </td>
      <td data-th="Date" className="col date px-4 py-3 text-sm border-b border-ccc">
        {formatOrderDateShort(order.order_date)}
      </td>
      <td data-th="Created By" className="col shipping px-4 py-3 text-sm border-b border-ccc">
        {createdByDisplay}
      </td>
      <td data-th="Order Total" className="col total px-4 py-3 text-sm border-b border-ccc">
        <span className="price">{total}</span>
      </td>
      <td data-th="Status" className="col status px-4 py-3 text-sm border-b border-ccc">
        <span className={statusClass(order.status)}>
          {order.status ? order.status.replace(/_/g, " ") : "—"}
        </span>
      </td>
      <td data-th="Action" className="col actions px-4 py-3 text-sm border-b border-ccc text-center">
        <Link href={href} className="action view text-theme-primary hover:underline text-sm">
          <span>View Order</span>
        </Link>
      </td>
    </tr>
  );
});
OrderRow.displayName = "OrderRow";

function OrdersTableComponent({ orders, createdByDisplay = "—" }: OrdersTableProps) {
  const hasOrders = useMemo(() => orders && orders.length > 0, [orders]);

  if (!hasOrders) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto w-full">
      <table
        className="data table table-order-items history w-full border-collapse border border-aaa"
        id="my-orders-table"
      >
        <caption className="table-caption sr-only">Orders</caption>
        <thead>
          <tr className="bg-f0f0f0 border-b-2 border-aaa">
            <th scope="col" className="col id px-4 py-3 text-left text-xs font-bold uppercase">
              ID
            </th>
            <th data-th="PO number" className="col po-number px-4 py-3 text-left text-xs font-bold uppercase">
              PO number
            </th>
            <th scope="col" className="col oracle-id px-4 py-3 text-left text-xs font-bold uppercase">
              Order #
            </th>
            <th scope="col" className="col date px-4 py-3 text-left text-xs font-bold uppercase">
              Date
            </th>
            <th scope="col" className="col shipping px-4 py-3 text-left text-xs font-bold uppercase">
              Created By
            </th>
            <th scope="col" className="col total px-4 py-3 text-left text-xs font-bold uppercase">
              Order Total
            </th>
            <th scope="col" className="col status px-4 py-3 text-left text-xs font-bold uppercase">
              Status
            </th>
            <th scope="col" className="col actions px-4 py-3 text-center text-xs font-bold uppercase">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {orders!.map((order, idx) => (
            <OrderRow
              key={order.id || `${order.number}-${idx}`}
              order={order}
              createdByDisplay={createdByDisplay}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const OrdersTable = memo(OrdersTableComponent);
OrdersTable.displayName = "OrdersTable";
