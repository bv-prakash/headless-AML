"use client";

import type { ShippingMethodOnAddress } from "@/src/framework/graphql/mutations/checkoutMutations";
import {
  shippingMethodKey,
  shippingMethodLabel,
} from "@/src/components/checkout/shippingMethodHelpers";

type CheckoutShippingMethodsProps = {
  readonly loading?: boolean;
  readonly options: readonly ShippingMethodOnAddress[];
  readonly selectedShipKey: string | null;
  readonly onSelect: (key: string) => void;
};

/** Always visible on the shipping step; options fill as the address is applied to the quote. */
export default function CheckoutShippingMethods({
  loading = false,
  options,
  selectedShipKey,
  onSelect,
}: CheckoutShippingMethodsProps) {
  return (
    <section
      aria-labelledby="checkout-ship-method-heading"
    >
      <h2
        id="checkout-ship-method-heading"
        className="text-lg font-semibold text-black uppercase mb-4 border-b border-aaa pb-2.5"
      >
        Shipping method
      </h2>

      {loading ? (
        <div
          className="flex items-center gap-3 py-4 text-sm text-gray-600"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="h-8 w-8 shrink-0 rounded-full border-2 border-gray-200 border-t-theme-primary animate-spin"
            aria-hidden
          />
          <span>Updating delivery options for your address…</span>
        </div>
      ) : options.length === 0 ? (
        <p className="text-sm text-gray-600 leading-relaxed">
          Enter a complete shipping address (and billing if different). Delivery
          options update automatically when your address is ready.
        </p>
      ) : (
        <>
          <ul className="space-y-2" role="radiogroup" aria-label="Shipping methods">
            {options.map((m) => {
              const key = shippingMethodKey(m);
              const selected = selectedShipKey === key;
              return (
                <li key={key}>
                  <label
                    className={`flex gap-3 cursor-pointer rounded border p-3 text-sm ${
                      selected
                        ? "border-theme-primary ring-1 ring-theme-primary"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="checkout-ship-method"
                      className="mt-0.5 h-4 w-4 shrink-0 text-theme-primary"
                      checked={selected}
                      onChange={() => onSelect(key)}
                    />
                    <span>{shippingMethodLabel(m)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
