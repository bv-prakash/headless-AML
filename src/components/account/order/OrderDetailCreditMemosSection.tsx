import type { CustomerOrderCreditMemo } from "@/src/framework/graphql/customer-orders/types";
import { formatOrderMoney } from "@/src/components/account/customer-orders/orderFormat";
import {
  ORDER_DETAIL_TABLE_CELL,
  ORDER_DETAIL_TABLE_HEAD,
} from "@/src/components/account/order/orderDetailTableClasses";

export type OrderDetailCreditMemosSectionProps = {
  readonly memos: readonly CustomerOrderCreditMemo[];
};

export function OrderDetailCreditMemosSection({ memos }: OrderDetailCreditMemosSectionProps) {
  if (!memos.length) return null;
  return (
    <section className="border-t border-aaa pt-6">
      <h2 className="block-title font-normal text-black text-lg mb-3">Credit memos</h2>
      <div className="overflow-x-auto border border-aaa">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-f0f0f0">
              <th className={ORDER_DETAIL_TABLE_HEAD}>Credit memo #</th>
              <th className={`${ORDER_DETAIL_TABLE_HEAD} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {memos.map((cm) => (
              <tr key={cm.id}>
                <td className={ORDER_DETAIL_TABLE_CELL}>{cm.number}</td>
                <td className={`${ORDER_DETAIL_TABLE_CELL} text-right`}>
                  {formatOrderMoney(cm.total?.grand_total ?? null)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
