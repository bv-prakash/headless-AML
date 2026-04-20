import type { CustomerOrderDetail } from "@/src/framework/graphql/queries/customerOrders";
import {
  formatOrderDate,
  orderDisplayId,
  orderPoNumber,
} from "@/src/framework/graphql/queries/customerOrders";

export type OrderDetailHeaderSectionProps = {
  readonly order: CustomerOrderDetail;
  readonly createdByDisplay: string;
  readonly reorderLoading: boolean;
  readonly returnHref: string | null;
  readonly onReorder: () => void | Promise<void>;
  readonly onPrintOrder: () => void;
};

export function OrderDetailHeaderSection({
  order,
  createdByDisplay,
  reorderLoading,
  returnHref,
  onReorder,
  onPrintOrder,
}: OrderDetailHeaderSectionProps) {
  return (
    <div className="page-title-wrapper border-b border-aaa pb-4">
      <div className="order-details space-y-4">
        <div className="track-details space-y-2">
          <div className="order-track flex flex-wrap items-baseline gap-3">
            <span className="order-id text-lg font-semibold">Order Number #{order.number}</span>
            <span className="order-status text-sm font-medium capitalize text-gray-800">
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <div className="order-increament-id text-sm text-gray-700">ID #{orderDisplayId(order)}</div>
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
  );
}
