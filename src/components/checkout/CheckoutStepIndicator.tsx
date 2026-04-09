"use client";

type CheckoutStep = "shipping" | "payment";

type CheckoutStepIndicatorProps = {
  readonly step: CheckoutStep;
  /** On the payment step, returns shopper to shipping (Magento `navigateTo`). */
  readonly onNavigateToShipping?: () => void;
};

/**
 * Magento Luma–style `opc-progress-bar`: Shipping → Payment with `_active` / `_complete`.
 */
export default function CheckoutStepIndicator({
  step,
  onNavigateToShipping,
}: CheckoutStepIndicatorProps) {
  const onPayment = step === "payment";
  const shippingProcessed = onPayment;
  const shippingActive = step === "shipping";
  const paymentActive = onPayment;

  return (
    <nav className="mb-8" aria-label="Checkout progress">
      <ul
        className="opc-progress-bar m-0 flex w-full list-none flex-wrap gap-0 border-b border-gray-300 bg-[#f5f5f5] p-0"
        role="list"
      >
        <li
          className={[
            "opc-progress-bar-item m-0 flex min-h-[48px] flex-1 basis-0 items-center justify-center border-b-[3px] px-3 py-3 text-center text-sm font-semibold uppercase tracking-wide transition-colors",
            shippingActive
              ? "_active border-theme-primary bg-white text-black"
              : shippingProcessed
                ? "_complete border-transparent bg-white/90 text-gray-800"
                : "border-transparent text-gray-500",
          ].join(" ")}
        >
          {shippingProcessed && onNavigateToShipping ? (
            <button
              type="button"
              onClick={onNavigateToShipping}
              className="max-w-full text-inherit underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary"
            >
              Shipping
            </button>
          ) : (
            <span className={shippingActive ? "text-black" : "text-inherit"}>
              Shipping
            </span>
          )}
        </li>

        <li
          className={[
            "opc-progress-bar-item m-0 flex min-h-[48px] flex-1 basis-0 items-center justify-center border-b-[3px] px-3 py-3 text-center text-sm font-semibold uppercase tracking-wide transition-colors",
            paymentActive
              ? "_active border-theme-primary bg-white text-black"
              : "border-transparent text-gray-500",
          ].join(" ")}
        >
          <span>Payment</span>
        </li>
      </ul>
    </nav>
  );
}
