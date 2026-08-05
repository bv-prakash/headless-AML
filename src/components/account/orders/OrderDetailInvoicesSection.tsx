import type { CustomerOrderInvoice } from "@/src/framework/graphql/customer-orders/types";
import { formatOrderMoney } from "@/src/components/account/orders/orderFormat";
import {
  ORDER_DETAIL_TABLE_CELL,
  ORDER_DETAIL_TABLE_HEAD,
} from "@/src/components/account/orders/orderDetailTableClasses";

export type OrderDetailInvoicesSectionProps = {
  readonly invoices: readonly CustomerOrderInvoice[];
};

/** Expect `invoices.length > 0` when rendered. */
export function OrderDetailInvoicesSection({ invoices }: OrderDetailInvoicesSectionProps) {
  return (
    <div className="order-details-items invoice">
      <div className="overflow-x-auto border border-aaa">
        <table className="data table table-order-items w-full border-collapse">
          <caption className="table-caption sr-only">Invoices</caption>
          <thead>
            <tr>
              <th className={ORDER_DETAIL_TABLE_HEAD}>Invoice #</th>
              <th className={`${ORDER_DETAIL_TABLE_HEAD} text-right`}>Grand total</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-f4f4f4">
                <td className={ORDER_DETAIL_TABLE_CELL}>{inv.number}</td>
                <td className={`${ORDER_DETAIL_TABLE_CELL} text-right whitespace-nowrap`}>
                  {formatOrderMoney(inv.total?.grand_total ?? null)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
