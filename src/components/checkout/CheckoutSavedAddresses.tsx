"use client";

import type { CustomerAddressNode } from "@/src/framework/graphql/queries/customerInfo";
import { formatCustomerAddressSummary, sameAddressId } from "@/src/components/checkout/addressHelpers";

type CheckoutSavedAddressesProps = {
  readonly savedAddresses: readonly CustomerAddressNode[];
  readonly selectedSavedAddressId: number | null;
  readonly onSelectAddress: (addressId: number) => void;
  readonly onAddNew: () => void;
};

export default function CheckoutSavedAddresses({
  savedAddresses,
  selectedSavedAddressId,
  onSelectAddress,
  onAddNew,
}: CheckoutSavedAddressesProps) {
  return (
    <div className="space-y-4 mb-6">
      <ul className="space-y-3" role="listbox" aria-label="Saved shipping addresses">
        {savedAddresses.map((addr) => {
          const selected = sameAddressId(selectedSavedAddressId, addr.id);
          return (
            <li key={addr.id}>
              <label
                className={`flex gap-3 cursor-pointer rounded border p-4 transition-colors ${
                  selected
                    ? "border-theme-primary bg-white ring-1 ring-theme-primary"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="checkout-saved-shipping"
                  className="mt-1 h-4 w-4 shrink-0 text-theme-primary"
                  checked={selected}
                  onChange={() => onSelectAddress(Number(addr.id))}
                />
                <span className="text-sm text-gray-800 leading-snug">
                  {formatCustomerAddressSummary(addr)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onAddNew}
        className="text-sm font-semibold text-theme-primary underline hover:no-underline"
      >
        + Add New address
      </button>
    </div>
  );
}
