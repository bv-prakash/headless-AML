import Link from "next/link";
import type { CustomerOrderDetail, CustomerOrderLineItem } from "@/src/framework/graphql/customer-orders/types";
import { formatOrderMoney, lineRowTotalMoney } from "@/src/components/account/customer-orders/orderFormat";
import {
  ORDER_DETAIL_TABLE_CELL,
  ORDER_DETAIL_TABLE_HEAD,
} from "@/src/components/account/order/orderDetailTableClasses";

function ItemsTable({ items }: { items: readonly CustomerOrderLineItem[] }) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="data table table-order-items w-full border-collapse min-w-[640px] border border-aaa">
        <caption className="table-caption sr-only">Items Ordered</caption>
        <thead className="border-b border-aaa">
          <tr>
            <th className={`${ORDER_DETAIL_TABLE_HEAD} col name`}>Product Name</th>
            <th className={`${ORDER_DETAIL_TABLE_HEAD} col sku`}>SKU</th>
            <th className={`${ORDER_DETAIL_TABLE_HEAD} col qty text-center`}>Qty</th>
            <th className={`${ORDER_DETAIL_TABLE_HEAD} col price text-right`}>Price</th>
            <th className={`${ORDER_DETAIL_TABLE_HEAD} col subtotal text-right`}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((line) => {
            const name = line.product_name ?? line.product_sku;
            const pdp = line.product_url_key ? `/${line.product_url_key}` : null;
            return (
              <tr key={line.id} className="hover:bg-f4f4f4 border-b border-aaa last:border-b-0">
                <td className={`${ORDER_DETAIL_TABLE_CELL} col name`} data-th="Product Name">
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
                <td className={`${ORDER_DETAIL_TABLE_CELL} col sku`} data-th="SKU">
                  {line.product_sku}
                </td>
                <td className={`${ORDER_DETAIL_TABLE_CELL} col qty text-center`} data-th="Qty">
                  {line.quantity_ordered != null ? String(line.quantity_ordered) : "—"}
                </td>
                <td className={`${ORDER_DETAIL_TABLE_CELL} col price text-right whitespace-nowrap`} data-th="Price">
                  {formatOrderMoney(line.product_sale_price ?? null)}
                </td>
                <td
                  className={`${ORDER_DETAIL_TABLE_CELL} col subtotal text-right whitespace-nowrap`}
                  data-th="Subtotal"
                >
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

export type OrderDetailItemsSectionProps = {
  readonly order: CustomerOrderDetail;
};

export function OrderDetailItemsSection({ order }: OrderDetailItemsSectionProps) {
  const items = order.items ?? [];
  return (
    <div className="order-details-items ordered bg-f0f0f0 px-7.5 pt-5 pb-10 mb-7.5 md:mb-10">
      {items.length ? <ItemsTable items={items} /> : <p className="text-black p-5">No line items.</p>}
      <TotalsSummary order={order} />
    </div>
  );
}
