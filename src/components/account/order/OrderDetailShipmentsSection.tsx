import type {
  CustomerOrderShipment,
  CustomerOrderShipmentItem,
} from "@/src/framework/graphql/customer-orders/types";
import {
  ORDER_DETAIL_TABLE_CELL,
  ORDER_DETAIL_TABLE_HEAD,
} from "@/src/components/account/order/orderDetailTableClasses";

function ShipmentItemsTable({ lines }: { lines: readonly CustomerOrderShipmentItem[] }) {
  if (!lines.length) return null;
  return (
    <div className="table-wrapper order-items-shipment mt-3">
      <table className="data table table-order-items shipment w-full border-collapse border border-aaa">
        <caption className="table-caption sr-only">Items Shipped</caption>
        <thead>
          <tr>
            <th className={`${ORDER_DETAIL_TABLE_HEAD} col name`}>Product Name</th>
            <th className={`${ORDER_DETAIL_TABLE_HEAD} col sku`}>SKU</th>
            <th className={`${ORDER_DETAIL_TABLE_HEAD} col qty`}>Qty Shipped</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td className={`${ORDER_DETAIL_TABLE_CELL} col name`} data-th="Product Name">
                <strong className="product name product-item-name font-medium">
                  {line.product_name ?? line.product_sku}
                </strong>
              </td>
              <td className={`${ORDER_DETAIL_TABLE_CELL} col sku`} data-th="SKU">
                {line.product_sku}
              </td>
              <td className={`${ORDER_DETAIL_TABLE_CELL} col qty`} data-th="Qty Shipped">
                {line.quantity_shipped != null ? String(line.quantity_shipped) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type OrderDetailShipmentsSectionProps = {
  readonly shipments: readonly CustomerOrderShipment[];
};

/** Expect `shipments.length > 0` when rendered. */
export function OrderDetailShipmentsSection({ shipments }: OrderDetailShipmentsSectionProps) {
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
