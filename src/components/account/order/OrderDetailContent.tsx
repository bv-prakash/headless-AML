"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/src/framework/graphql/customer-orders/mutations/reorderItems";
import { CUSTOMER_ORDER_DETAIL_QUERY } from "@/src/framework/graphql/customer-orders/queries/getCustomerOrderDetail";
import type {
  CustomerOrderDetail,
  CustomerOrderDetailData,
  CustomerOrderDetailVariables,
} from "@/src/framework/graphql/customer-orders/types";
import { formatCustomerFirstLast } from "@/src/components/account/customer-orders/orderFormat";
import PageLoader from "@/src/components/common/PageLoader";
import { OrderInformationBlock } from "@/src/components/account/order/OrderInformationBlock";
import { OrderDetailCreditMemosSection } from "@/src/components/account/order/OrderDetailCreditMemosSection";
import { OrderDetailHeaderSection } from "@/src/components/account/order/OrderDetailHeaderSection";
import { OrderDetailInvoicesSection } from "@/src/components/account/order/OrderDetailInvoicesSection";
import { OrderDetailItemsSection } from "@/src/components/account/order/OrderDetailItemsSection";
import { OrderDetailShipmentsSection } from "@/src/components/account/order/OrderDetailShipmentsSection";

type OrderDetailTabId = "items" | "invoices" | "shipments";

function storefrontBase(): string {
  return (config.commerce.baseUrl ?? "").replace(/\/$/, "");
}

type OrderDetailContentProps = {
  readonly orderNumber: string;
};

export function OrderDetailContent({ orderNumber }: OrderDetailContentProps) {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<OrderDetailTabId>("items");

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

  const invoices = order?.invoices ?? [];
  const shipments = order?.shipments ?? [];
  const memos = order?.credit_memos ?? [];
  const hasInvoices = invoices.length > 0;
  const hasShipments = shipments.length > 0;
  const showTabs = hasInvoices || hasShipments;

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
      const { data: res, error: gqlError } = await reorderMut({ variables: { orderNumber: order.number } });
      if (gqlError) {
        toast.error(getErrorMessage(gqlError, "Could not reorder."));
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

  const createdByDisplay = useMemo(
    () => formatCustomerFirstLast(data?.customer?.firstname, data?.customer?.lastname),
    [data?.customer?.firstname, data?.customer?.lastname],
  );

  useEffect(() => {
    if (tab === "invoices" && !hasInvoices) setTab("items");
    if (tab === "shipments" && !hasShipments) setTab("items");
  }, [tab, hasInvoices, hasShipments]);

  const tabLink = (id: OrderDetailTabId, label: string) => {
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

  return (
    <div className="order-print-root column main space-y-6">
      <Link
        href="/account/orders"
        className="print:hidden text-sm text-theme-primary hover:underline inline-block"
      >
        ← Back to My Orders
      </Link>

      <OrderDetailHeaderSection
        order={order}
        createdByDisplay={createdByDisplay}
        reorderLoading={reorderLoading}
        returnHref={returnHref}
        onReorder={onReorder}
        onPrintOrder={onPrintOrder}
      />

      {showTabs ? (
        <>
          <ul className="items order-links print:hidden flex flex-wrap gap-4 list-none m-0 p-0 border-b border-aaa pb-2">
            {tabLink("items", "Items Ordered")}
            {hasInvoices ? tabLink("invoices", "Invoices") : null}
            {hasShipments ? tabLink("shipments", "Order Shipments") : null}
          </ul>

          {tab === "items" ? <OrderDetailItemsSection order={order} /> : null}
          {tab === "invoices" && hasInvoices ? <OrderDetailInvoicesSection invoices={invoices} /> : null}
          {tab === "shipments" && hasShipments ? <OrderDetailShipmentsSection shipments={shipments} /> : null}
        </>
      ) : (
        <OrderDetailItemsSection order={order} />
      )}

      <OrderDetailCreditMemosSection memos={memos} />
      <OrderInformationBlock order={order} paymentLabel={paymentLabel} />
    </div>
  );
}
