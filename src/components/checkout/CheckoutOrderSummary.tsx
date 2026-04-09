"use client";

import { useId, useMemo, useState } from "react";
import { formatPrice } from "@/src/utils/format";
import CheckoutCartLineItem from "@/src/components/checkout/CheckoutCartLineItem";
import type { CartData } from "@/src/framework/graphql/mutations/cartMutations";
import type { CartItem } from "@/src/framework/graphql/mutations/cartMutations";
import type { MoneyAmount } from "@/src/framework/graphql/mutations/checkoutMutations";

type ValidCartItem = CartItem & {
  product: NonNullable<CartItem["product"]>;
  prices: NonNullable<CartItem["prices"]>;
};

type CheckoutOrderSummaryProps = {
  readonly step: "shipping" | "payment";
  readonly cart: CartData | null | undefined;
  readonly selectedShippingLabel?: string | null;
  readonly shippingMethodTitle?: string | null;
  readonly shippingAmount?: MoneyAmount | null;
  /** Shown on payment step with Edit; full ship-to summary text */
  readonly shippingAddressSummary?: string | null;
  readonly onEditShippingAddress?: () => void;
  readonly onEditShippingMethod?: () => void;
};

export default function CheckoutOrderSummary({
  step,
  cart,
  selectedShippingLabel,
  shippingMethodTitle,
  shippingAmount,
  shippingAddressSummary,
  onEditShippingAddress,
  onEditShippingMethod,
}: CheckoutOrderSummaryProps) {
  const itemsBlockId = useId();
  const itemsToggleId = `${itemsBlockId}-toggle`;
  const itemsPanelId = `${itemsBlockId}-panel`;
  const [itemsOpen, setItemsOpen] = useState(true);

  const items = useMemo(
    () =>
      (cart?.items ?? []).filter(
        (i): i is ValidCartItem => i.product != null && i.prices != null,
      ),
    [cart?.items],
  );

  const subtotal = cart?.prices?.subtotal_excluding_tax;
  const grand = cart?.prices?.grand_total;

  const showPaymentExtras =
    step === "payment" &&
    shippingAddressSummary != null &&
    shippingAddressSummary !== "" &&
    onEditShippingAddress &&
    onEditShippingMethod;

  return (
    <aside
      className="w-full lg-custom:w-[380px] shrink-0 bg-f0f0f0 p-5 lg:sticky lg:top-6"
      aria-label="Order summary"
    >
      <div className="text-xl leading-[30px] md:text-2xl font-normal uppercase mb-2.5 pb-2.5 border-b border-black">
        Order summary
      </div>

      {showPaymentExtras ? (
        <div className="space-y-5 mb-5">
          <section aria-labelledby="summary-ship-to-heading">
            <div className="flex justify-between items-start gap-3 mb-1.5">
              <div
                id="summary-ship-to-heading"
                className="font-bold uppercase tracking-wide text-gray-600"
              >
                Ship to
              </div>
              <button
                type="button"
                onClick={onEditShippingAddress}
                className="shrink-0 text-sm font-semibold text-theme-primary underline hover:no-underline"
                aria-label="Edit shipping address"
              >
                Edit
              </button>
            </div>
            <div className="text-gray-800 leading-snug">{shippingAddressSummary}</div>
          </section>

          <section
            className="border-t border-black/10 pt-4"
            aria-labelledby="summary-ship-method-heading"
          >
            <div className="flex justify-between items-start gap-3 mb-1.5">
              <div
                id="summary-ship-method-heading"
                className="text-xs font-bold uppercase tracking-wide text-gray-600"
              >
                Shipping method
              </div>
              <button
                type="button"
                onClick={onEditShippingMethod}
                className="shrink-0 text-sm font-semibold text-theme-primary underline hover:no-underline"
                aria-label="Edit shipping method"
              >
                Edit
              </button>
            </div>
            <p className="text-sm text-gray-800 leading-snug">
              {shippingMethodTitle ?? selectedShippingLabel ?? "—"}
            </p>
          </section>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-gray-600">No items in this order.</p>
      ) : (
        <div className="mb-5 border-b border-gray-200 pb-1">
          <button
            type="button"
            id={itemsToggleId}
            aria-expanded={itemsOpen}
            aria-controls={itemsPanelId}
            onClick={() => setItemsOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm font-bold uppercase tracking-wide text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary"
          >
            <span>{step === "payment" ? "Cart items" : "Items"}</span>
            <i
              className={`icon-back-arrow text-lg leading-none before:font-bold shrink-0 text-gray-500 transition-transform duration-200 ${
                itemsOpen ? "rotate-90" : "-rotate-90"
              }`}
              aria-hidden
            />
          </button>
          <div
            id={itemsPanelId}
            role="region"
            aria-labelledby={itemsToggleId}
            hidden={!itemsOpen}
          >
            <ul className="space-y-0 max-h-[min(50vh,420px)] overflow-y-auto pr-1 pt-1">
              {items.map((item) => (
                <CheckoutCartLineItem key={item.uid} item={item} />
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
        {subtotal && (
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span className="font-semibold text-black">
              {formatPrice(subtotal.value, subtotal.currency)}
            </span>
          </div>
        )}

        {step === "payment" &&
          (shippingAmount != null || selectedShippingLabel) && (
            <div className="flex justify-between gap-2 text-gray-700">
              <span className="shrink-0">Shipping</span>
              <span className="text-right font-medium text-black">
                {shippingAmount != null
                  ? formatPrice(shippingAmount.value, shippingAmount.currency)
                  : selectedShippingLabel}
              </span>
            </div>
          )}

        {step === "payment" && grand && (
          <div className="flex justify-between text-base font-bold text-black pt-2 border-t border-gray-200">
            <span>Order total</span>
            <span>{formatPrice(grand.value, grand.currency)}</span>
          </div>
        )}

        {step === "shipping" && subtotal && (
          <p className="text-xs text-gray-500 pt-1">
            Subtotal before shipping. Delivery and final total appear after you
            choose shipping and continue to payment.
          </p>
        )}
      </div>
    </aside>
  );
}
