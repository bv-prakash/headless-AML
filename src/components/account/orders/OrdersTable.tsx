"use client";

import { useMemo, memo } from "react";
import Link from "next/link";
import type { CustomerOrderListItem } from "@/src/framework/graphql/customer-orders/types";
import {
  formatOrderDateShort,
  formatOrderMoney,
  orderDisplayId,
  orderPoNumber,
} from "@/src/components/account/orders/orderFormat";

type OrdersTableProps = {
  orders?: readonly CustomerOrderListItem[] | null;
  /** From `customer { firstname lastname }` on the orders query (logged-in account). */
  createdByDisplay?: string;
};

const STATUS_BADGE =
  "inline-block px-3 py-2 rounded font-medium capitalize";
const STATUS_COMPLETE = "bg-green-100 text-light-green";
const STATUS_CANCELLED = "bg-red-100 text-light-red";
const STATUS_DEFAULT = "bg-yellow-100 text-light-yellow";

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
    <tr className="border-b border-ccc hover:bg-f4f4f4">
      <td data-th="ID" className="col id p-5">
        {orderDisplayId(order)}
      </td>
      <td data-th="PO number" className="col po-number p-5">
        {orderPoNumber(order)}
      </td>
      <td data-th="Order #" className="col oracle-id p-5">
        <Link href={href} className="text-theme-primary hover:underline">
          {order.number}
        </Link>
      </td>
      <td data-th="Date" className="col date p-5">
        {formatOrderDateShort(order.order_date)}
      </td>
      <td data-th="Created By" className="col shipping p-5">
        {createdByDisplay}
      </td>
      <td data-th="Order Total" className="col total p-5">
        <span className="price">{total}</span>
      </td>
      <td data-th="Status" className="col status p-5">
        <span className={statusClass(order.status)}>
          {order.status ? order.status.replace(/_/g, " ") : "—"}
        </span>
      </td>
      <td data-th="Action" className="col actions p-5">
        <Link href={href} className="action view text-theme-primary hover:underline">
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
            <th scope="col" className="col id px-5 py-3.5 text-left font-bold uppercase align-bottom">
              ID
            </th>
            <th data-th="PO number" className="col po-number px-5 py-3.5 text-left font-bold uppercase align-bottom">
              PO number
            </th>
            <th scope="col" className="col oracle-id px-5 py-3.5 text-left font-bold uppercase align-bottom">
              Order #
            </th>
            <th scope="col" className="col date px-5 py-3.5 text-left font-bold uppercase align-bottom">
              Date
            </th>
            <th scope="col" className="col shipping px-5 py-3.5 text-left font-bold uppercase align-bottom">
              Created By
            </th>
            <th scope="col" className="col total px-5 py-3.5 text-left font-bold uppercase align-bottom">
              Order Total
            </th>
            <th scope="col" className="col status px-5 py-3.5 text-left font-bold uppercase align-bottom">
              Status
            </th>
            <th scope="col" className="col actions px-5 py-3.5 text-left font-bold uppercase align-bottom">
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
