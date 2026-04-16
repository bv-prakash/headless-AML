"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/src/store/hooks";
import { openMinicart, setCart } from "@/src/store/slices/cartSlice";
import config from "@/src/config/config";
import { getErrorMessage } from "@/src/utils/errors";
import { storefrontOrderEntityId } from "@/src/utils/orderStorefront";
import {
  REORDER_ITEMS_MUTATION,
  type ReorderItemsResponse,
  type ReorderItemsVariables,
} from "@/src/framework/graphql/mutations/orderMutations";
import {
  CUSTOMER_ORDER_DETAIL_QUERY,
  type CustomerOrderDetail,
  type CustomerOrderDetailData,
  type CustomerOrderDetailVariables,
  type CustomerOrderInvoice,
  type CustomerOrderLineItem,
  type CustomerOrderShipment,
  type CustomerOrderShipmentItem,
  formatAddressLines,
  formatCustomerFirstLast,
  formatOrderDate,
  formatOrderMoney,
  lineRowTotalMoney,
  orderDisplayId,
  orderPoNumber,
} from "@/src/framework/graphql/queries/customerOrders";
import PageLoader from "@/src/components/common/PageLoader";

type OrderTab = "items" | "invoices" | "shipments";

const TABLE_HEAD =
  "px-3 py-2.5 text-left text-xs font-bold uppercase bg-f0f0f0 border-b border-aaa";
const TABLE_CELL = "px-3 py-3 text-sm border-b border-ccc align-top";

function ItemsTable({ items }: { items: readonly CustomerOrderLineItem[] }) {
  return (
    <div className="overflow-x-auto border border-aaa">
      <table className="data table table-order-items w-full border-collapse min-w-[640px]">
        <caption className="table-caption sr-only">Items Ordered</caption>
        <thead>
          <tr>
            <th className={`${TABLE_HEAD} col name`}>Product Name</th>
            <th className={`${TABLE_HEAD} col sku`}>SKU</th>
            <th className={`${TABLE_HEAD} col qty text-center`}>Qty</th>
            <th className={`${TABLE_HEAD} col price text-right`}>Price</th>
            <th className={`${TABLE_HEAD} col subtotal text-right`}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((line) => {
            const name = line.product_name ?? line.product_sku;
            const pdp = line.product_url_key ? `/${line.product_url_key}` : null;
            return (
              <tr key={line.id} className="hover:bg-f4f4f4">
                <td className={`${TABLE_CELL} col name`} data-th="Product Name">
                  {pdp ? (
                    <strong className="product name product-item-name font-medium">
                      <Link href={pdp} className="text-theme-primary hover:underline">
                        {name}
                      </Link>
                    </strong>
                  ) : (
                    <strong className="product name product-item-name font-medium">{name}</strong>
                  )}
                </td>
                <td className={`${TABLE_CELL} col sku`} data-th="SKU">
                  {line.product_sku}
                </td>
                <td className={`${TABLE_CELL} col qty text-center`} data-th="Qty">
                  {line.quantity_ordered != null ? String(line.quantity_ordered) : "—"}
                </td>
                <td className={`${TABLE_CELL} col price text-right whitespace-nowrap`} data-th="Price">
                  {formatOrderMoney(line.product_sale_price ?? null)}
                </td>
                <td className={`${TABLE_CELL} col subtotal text-right whitespace-nowrap`} data-th="Subtotal">
                  {formatOrderMoney(lineRowTotalMoney(line))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InvoicesBlock({ invoices }: { invoices: readonly CustomerOrderInvoice[] }) {
  if (!invoices.length) {
    return <p className="text-sm text-gray-600 m-0">No invoices for this order.</p>;
  }
  return (
    <div className="overflow-x-auto border border-aaa">
      <table className="data table table-order-items w-full border-collapse">
        <caption className="table-caption sr-only">Invoices</caption>
        <thead>
          <tr>
            <th className={TABLE_HEAD}>Invoice #</th>
            <th className={`${TABLE_HEAD} text-right`}>Grand total</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-f4f4f4">
              <td className={TABLE_CELL}>{inv.number}</td>
              <td className={`${TABLE_CELL} text-right whitespace-nowrap`}>
                {formatOrderMoney(inv.total?.grand_total ?? null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShipmentItemsTable({ lines }: { lines: readonly CustomerOrderShipmentItem[] }) {
  if (!lines.length) return null;
  return (
    <div className="table-wrapper order-items-shipment mt-3">
      <table className="data table table-order-items shipment w-full border-collapse border border-aaa">
        <caption className="table-caption sr-only">Items Shipped</caption>
        <thead>
          <tr>
            <th className={`${TABLE_HEAD} col name`}>Product Name</th>
            <th className={`${TABLE_HEAD} col sku`}>SKU</th>
            <th className={`${TABLE_HEAD} col qty`}>Qty Shipped</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td className={`${TABLE_CELL} col name`} data-th="Product Name">
                <strong className="product name product-item-name font-medium">
                  {line.product_name ?? line.product_sku}
                </strong>
              </td>
              <td className={`${TABLE_CELL} col sku`} data-th="SKU">
                {line.product_sku}
              </td>
              <td className={`${TABLE_CELL} col qty`} data-th="Qty Shipped">
                {line.quantity_shipped != null ? String(line.quantity_shipped) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShipmentsPanel({ shipments }: { shipments: readonly CustomerOrderShipment[] }) {
  if (!shipments.length) {
    return <p className="text-sm text-gray-600 m-0">No shipments for this order.</p>;
  }
  return (
    <div className="order-details-items shipments space-y-6">
      {shipments.map((ship) => (
        <div key={ship.id} className="border border-aaa p-4 bg-white">
          <div className="order-title mb-3">
            <strong>Shipment #{ship.number}</strong>
          </div>
          {ship.tracking && ship.tracking.length > 0 ? (
            <dl className="order-tracking m-0 mb-3" id={`tracking-${ship.id}`}>
              <dt className="tracking-title font-semibold text-sm">Tracking Number(s):</dt>
              <dd className="tracking-content text-sm text-gray-800 m-0 mt-1">
                {ship.tracking
                  .map((t) => t.number)
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </dl>
          ) : null}
          <ShipmentItemsTable lines={ship.items ?? []} />
        </div>
      ))}
    </div>
  );
}

function TotalsSummary({ order }: { order: CustomerOrderDetail }) {
  const t = order.total;
  if (!t) return null;
  const rows: { label: string; money: string }[] = [];
  if (t.subtotal) rows.push({ label: "Subtotal", money: formatOrderMoney(t.subtotal) });
  if (t.total_shipping) rows.push({ label: "Shipping", money: formatOrderMoney(t.total_shipping) });
  if (t.total_tax) rows.push({ label: "Tax", money: formatOrderMoney(t.total_tax) });
  rows.push({ label: "Grand total", money: formatOrderMoney(t.grand_total ?? null) });
  return (
    <div className="max-w-md ml-auto border border-aaa mt-6">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-ccc last:border-b-0">
              <th scope="row" className="text-left font-normal px-4 py-2 bg-f4f4f4">
                {r.label}
              </th>
              <td className="text-right px-4 py-2 font-medium whitespace-nowrap">{r.money}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isLikelyVirtualOrder(order: CustomerOrderDetail): boolean {
  return formatAddressLines(order.shipping_address).length === 0;
}

function storefrontBase(): string {
  return (config.commerce.baseUrl ?? "").replace(/\/$/, "");
}

type OrderDetailContentProps = {
  readonly orderNumber: string;
};

export function OrderDetailContent({ orderNumber }: OrderDetailContentProps) {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<OrderTab>("items");

  const { data, loading, error, refetch } = useQuery<CustomerOrderDetailData, CustomerOrderDetailVariables>(
    CUSTOMER_ORDER_DETAIL_QUERY,
    {
      variables: { orderNumber },
      skip: !orderNumber,
      fetchPolicy: "network-only",
    },
  );

  const [reorderMut, { loading: reorderLoading }] = useMutation<ReorderItemsResponse, ReorderItemsVariables>(
    REORDER_ITEMS_MUTATION,
  );

  const order: CustomerOrderDetail | undefined = data?.customer?.orders?.items?.[0];

  const entityId = useMemo(() => (order ? storefrontOrderEntityId(order.id) : ""), [order]);
  const base = useMemo(() => storefrontBase(), []);

  const returnHref = base && entityId ? `${base}/rma/returns/create/order_id/${entityId}/` : null;

  const onPrintOrder = useCallback(() => {
    window.print();
  }, []);

  const paymentLabel = useMemo(() => {
    const methods = order?.payment_methods;
    if (!methods?.length) return "—";
    return methods
      .map((m) => m.name)
      .filter(Boolean)
      .join(", ");
  }, [order?.payment_methods]);

  const onReorder = useCallback(async () => {
    if (!order?.number) return;
    try {
      const { data: res, errors } = await reorderMut({ variables: { orderNumber: order.number } });
      if (errors?.length) {
        toast.error(errors.map((e) => e.message).join(" "));
        return;
      }
      const errs = res?.reorderItems?.userInputErrors;
      if (errs?.length) {
        toast.error(errs.map((e) => e.message).join(" "));
        return;
      }
      const cart = res?.reorderItems?.cart;
      if (cart) {
        dispatch(setCart(cart));
        dispatch(openMinicart());
        toast.success("Items from this order were added to your cart.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not reorder."));
    }
  }, [order?.number, reorderMut, dispatch]);

  if (loading && !order) {
    return <PageLoader label="Loading order…" minHeightClassName="min-h-[40vh]" />;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-light-red" role="alert">
          {getErrorMessage(error, "Could not load this order.")}
        </p>
        <button type="button" className="text-sm text-theme-primary underline" onClick={() => void refetch()}>
          Try again
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-3">
        <p className="text-gray-700">We could not find that order.</p>
        <Link href="/account/orders" className="text-theme-primary underline text-sm">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const items = order.items ?? [];
  const invoices = order.invoices ?? [];
  const shipments = order.shipments ?? [];
  const memos = order.credit_memos ?? [];
  const createdByDisplay = formatCustomerFirstLast(data?.customer?.firstname, data?.customer?.lastname);

  const tabLink = (id: OrderTab, label: string) => {
    const isCurrent = tab === id;
    return (
      <li className={`nav item${isCurrent ? " current" : ""}`}>
        {isCurrent ? (
          <strong className="text-black">{label}</strong>
        ) : (
          <button
            type="button"
            className="text-theme-primary hover:underline bg-transparent border-0 cursor-pointer p-0"
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="order-print-root column main space-y-6">
      <Link
        href="/account/orders"
        className="print:hidden text-sm text-theme-primary hover:underline inline-block"
      >
        ← Back to My Orders
      </Link>

      <div className="page-title-wrapper border-b border-aaa pb-4">
        <div className="order-details space-y-4">
          <div className="track-details space-y-2">
            <div className="order-track flex flex-wrap items-baseline gap-3">
              <span className="order-id text-lg font-semibold">Order Number #{order.number}</span>
              <span className="order-status text-sm font-medium capitalize text-gray-800">
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="order-increament-id text-sm text-gray-700">
              ID #{orderDisplayId(order)}
            </div>
            <div className="order-po-number text-sm">
              <strong>PO Number:</strong> {orderPoNumber(order)}
            </div>
            <div className="order-date text-sm text-gray-700">
              <span className="label font-medium">Order Date:</span>{" "}
              <span>{formatOrderDate(order.order_date)}</span>
            </div>
            <div className="order-created-by text-sm text-gray-700">
              <span className="label font-medium">Created By:</span> <span>{createdByDisplay}</span>
            </div>
          </div>

          <div className="actions-toolbar order-actions-toolbar print:hidden flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              className="action order inline-flex items-center py-2 px-4 text-sm font-semibold uppercase border border-ccc bg-white hover:border-theme-primary hover:text-theme-primary disabled:opacity-50"
              disabled={reorderLoading}
              onClick={() => void onReorder()}
            >
              <span>{reorderLoading ? "…" : "Reorder"}</span>
            </button>
            <button
              type="button"
              className="action print inline-flex items-center py-2 px-4 text-sm font-semibold uppercase border border-ccc bg-white hover:border-theme-primary hover:text-theme-primary"
              onClick={onPrintOrder}
            >
              <span>Print Order</span>
            </button>
            {returnHref ? (
              <a
                href={returnHref}
                className="action return inline-flex items-center py-2 px-4 text-sm font-semibold uppercase border border-ccc bg-white hover:border-theme-primary hover:text-theme-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Return</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <ul className="items order-links print:hidden flex flex-wrap gap-4 list-none m-0 p-0 border-b border-aaa pb-2">
        {tabLink("items", "Items Ordered")}
        {tabLink("invoices", "Invoices")}
        {tabLink("shipments", "Order Shipments")}
      </ul>

      {tab === "items" ? (
        <div className="order-details-items ordered">
          {items.length ? <ItemsTable items={items} /> : <p className="text-sm text-gray-600">No line items.</p>}
          <TotalsSummary order={order} />
        </div>
      ) : null}

      {tab === "invoices" ? (
        <div className="order-details-items invoice">
          <InvoicesBlock invoices={invoices} />
        </div>
      ) : null}

      {tab === "shipments" ? <ShipmentsPanel shipments={shipments} /> : null}

      {memos.length > 0 ? (
        <section className="border-t border-aaa pt-6">
          <h2 className="block-title font-normal text-black text-lg mb-3">Credit memos</h2>
          <div className="overflow-x-auto border border-aaa">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-f0f0f0">
                  <th className={TABLE_HEAD}>Credit memo #</th>
                  <th className={`${TABLE_HEAD} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {memos.map((cm) => (
                  <tr key={cm.id}>
                    <td className={TABLE_CELL}>{cm.number}</td>
                    <td className={`${TABLE_CELL} text-right`}>
                      {formatOrderMoney(cm.total?.grand_total ?? null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="block block-order-details-view border border-aaa p-4 md:p-6 bg-white">
        <div className="block-title mb-4 pb-2 border-b border-ccc">
          <strong className="text-lg">Order Information</strong>
        </div>
        <div className="block-content grid grid-cols-1 md:grid-cols-2 gap-6">
          {!isLikelyVirtualOrder(order) ? (
            <div className="box box-order-shipping-address">
              <strong className="box-title block mb-2">
                <span>Shipping Address</span>
              </strong>
              <div className="box-content">
                <address className="not-italic text-sm text-gray-800 whitespace-pre-line">
                  {formatAddressLines(order.shipping_address).join("\n")}
                </address>
              </div>
            </div>
          ) : (
            <div className="box box-order-shipping-address">
              <strong className="box-title block mb-2">
                <span>Shipping</span>
              </strong>
              <div className="box-content text-sm text-gray-600">No shipping address on file.</div>
            </div>
          )}

          <div className="box box-order-shipping-method">
            <strong className="box-title block mb-2">
              <span>Shipping Method</span>
            </strong>
            <div className="box-content text-sm">
              {order.shipping_method || order.carrier || "—"}
            </div>
          </div>

          <div className="box box-order-billing-address">
            <strong className="box-title block mb-2">
              <span>Billing Address</span>
            </strong>
            <div className="box-content">
              <address className="not-italic text-sm text-gray-800 whitespace-pre-line">
                {formatAddressLines(order.billing_address).join("\n")}
              </address>
            </div>
          </div>

          <div className="box box-order-billing-method">
            <strong className="box-title block mb-2">
              <span>Payment Method</span>
            </strong>
            <div className="box-content text-sm">
              <strong>Payment:</strong> {paymentLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
