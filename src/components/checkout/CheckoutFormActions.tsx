"use client";

import Link from "next/link";
import Button from "@/src/components/common/controls/Button";

type CheckoutFormActionsProps = {
  readonly checkoutStep: "shipping" | "payment";
  readonly shippingOptionsCount: number;
  readonly shippingRatesLoading: boolean;
  readonly submitting: boolean;
  readonly onNextToPayment: () => void;
  readonly onPlaceOrder: () => void;
};

export default function CheckoutFormActions({
  checkoutStep,
  shippingOptionsCount,
  shippingRatesLoading,
  submitting,
  onNextToPayment,
  onPlaceOrder,
}: CheckoutFormActionsProps) {
  const nextDisabled =
    checkoutStep === "shipping" &&
    (shippingRatesLoading ||
      shippingOptionsCount === 0 ||
      submitting);

  return (
    <div className="flex flex-wrap gap-3 items-center pt-2">
      {checkoutStep === "shipping" && (
        <Button
          type="button"
          variant="primary"
          size="lg"
          loading={submitting}
          loadingLabel="Next…"
          disabled={nextDisabled}
          className="uppercase"
          onClick={onNextToPayment}
        >
          Next
        </Button>
      )}
      {checkoutStep === "payment" && (
        <Button
          type="button"
          variant="primary"
          size="lg"
          loading={submitting}
          loadingLabel="Placing order…"
          className="uppercase"
          onClick={onPlaceOrder}
        >
          Place order
        </Button>
      )}
      <Link
        href="/cart"
        className="inline-flex items-center justify-center font-semibold h-11 px-5 text-base border border-aaa bg-white text-gray-800 hover:bg-theme-primary hover:text-white hover:border-theme-primary transition-colors"
      >
        Back to cart
      </Link>
    </div>
  );
}
