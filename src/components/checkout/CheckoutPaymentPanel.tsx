"use client";

import Button from "@/src/components/common/Button";
import type { PaymentMethodQuote } from "@/src/framework/graphql/mutations/checkoutMutations";

type CheckoutPaymentPanelProps = {
  readonly paymentOptions: readonly PaymentMethodQuote[];
  readonly selectedPaymentCode: string | null;
  readonly onSelectPayment: (code: string) => void;
  readonly onBackToShipping: () => void;
};

export default function CheckoutPaymentPanel({
  paymentOptions,
  selectedPaymentCode,
  onSelectPayment,
  onBackToShipping,
}: CheckoutPaymentPanelProps) {
  return (
    <section
      aria-labelledby="checkout-payment-heading"
    >
      <h2
        id="checkout-payment-heading"
        className="text-lg font-semibold text-black uppercase mb-4 border-b border-aaa pb-2.5"
      >
        Payment
      </h2>
      <ul className="space-y-2" role="radiogroup" aria-label="Payment methods">
        {paymentOptions.map((p) => {
          const selected = selectedPaymentCode === p.code;
          return (
            <li key={p.code}>
              <label
                className={`flex gap-3 cursor-pointer rounded border p-3 text-sm ${
                  selected
                    ? "border-theme-primary ring-1 ring-theme-primary"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="checkout-pay-method"
                  className="mt-0.5 h-4 w-4 shrink-0 text-theme-primary"
                  checked={selected}
                  onChange={() => onSelectPayment(p.code)}
                />
                <span>{p.title || p.code}</span>
              </label>
            </li>
          );
        })}
      </ul>


      <button
        type="button"
        onClick={onBackToShipping}
        className="text-sm font-semibold text-theme-primary underline hover:no-underline"
      >
        ← Back to shipping
      </button>
    </section>
  );
}
