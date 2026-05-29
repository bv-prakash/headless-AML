import type { CustomerOrderDetail } from "@/src/framework/graphql/customer-orders/types";
import { formatAddressLines } from "@/src/components/account/orders/orderFormat";

const BLOCK_TITLE =
  "block-title font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px] mb-[15px] md:mb-5";

const BOX_TITLE =
  "box-title block bg-f0f0f0 uppercase leading-[20px] py-2.5 px-5 md:leading-[23px] md:py-3.5";

function isLikelyVirtualOrder(order: CustomerOrderDetail): boolean {
  return formatAddressLines(order.shipping_address).length === 0;
}

export type OrderInformationBlockProps = {
  readonly order: CustomerOrderDetail;
  readonly paymentLabel: string;
};

export function OrderInformationBlock({ order, paymentLabel }: OrderInformationBlockProps) {
  return (
    <div className="block block-order-details-view">
      <div className={BLOCK_TITLE}>Order Information</div>
      <div className="block-content grid grid-cols-1 lg:grid-cols-2 xl-custom:grid-cols-4! gap-5">
        {!isLikelyVirtualOrder(order) ? (
          <div className="box box-order-shipping-address border border-aaa">
            <strong className={BOX_TITLE}>
              <span>Shipping Address</span>
            </strong>
            <div className="box-content p-5">
              <address className="not-italic whitespace-pre-line">
                {formatAddressLines(order.shipping_address).join("\n")}
              </address>
            </div>
          </div>
        ) : (
          <div className="box box-order-shipping-address border border-aaa">
            <strong className={BOX_TITLE}>
              <span>Shipping</span>
            </strong>
            <div className="box-content p-5 text-gray-600">No shipping address on file.</div>
          </div>
        )}

        <div className="box box-order-shipping-method border border-aaa">
          <strong className={BOX_TITLE}>
            <span>Shipping Method</span>
          </strong>
          <div className="box-content p-5">{order.shipping_method || order.carrier || "—"}</div>
        </div>

        <div className="box box-order-billing-address border border-aaa">
          <strong className={BOX_TITLE}>
            <span>Billing Address</span>
          </strong>
          <div className="box-content p-5">
            <address className="not-italic whitespace-pre-line">
              {formatAddressLines(order.billing_address).join("\n")}
            </address>
          </div>
        </div>

        <div className="box box-order-billing-method border border-aaa">
          <strong className={BOX_TITLE}>
            <span>Payment Method</span>
          </strong>
          <div className="box-content p-5">
            <strong>Payment:</strong> {paymentLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
