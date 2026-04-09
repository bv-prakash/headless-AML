"use client";

import type { Dispatch, SetStateAction } from "react";
import CheckoutField from "@/src/components/checkout/CheckoutField";
import type { AddressFormState } from "@/src/components/checkout/addressTypes";

type BillingAddressFieldsProps = {
  readonly billing: AddressFormState;
  readonly setBilling: Dispatch<SetStateAction<AddressFormState>>;
  readonly billingSaveBook: boolean;
  readonly setBillingSaveBook: (v: boolean) => void;
};

export default function BillingAddressFields({
  billing,
  setBilling,
  billingSaveBook,
  setBillingSaveBook,
}: BillingAddressFieldsProps) {
  return (
    <section aria-labelledby="bill-addr-heading">
      <h2
        id="bill-addr-heading"
        className="text-lg font-bold text-black uppercase mb-4"
      >
        Billing address
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CheckoutField
          label="First name"
          value={billing.firstname}
          onChange={(v) => setBilling((s) => ({ ...s, firstname: v }))}
          required
        />
        <CheckoutField
          label="Last name"
          value={billing.lastname}
          onChange={(v) => setBilling((s) => ({ ...s, lastname: v }))}
          required
        />
        <CheckoutField
          label="Company"
          className="sm:col-span-2"
          value={billing.company}
          onChange={(v) => setBilling((s) => ({ ...s, company: v }))}
        />
        <CheckoutField
          label="Street"
          className="sm:col-span-2"
          value={billing.street1}
          onChange={(v) => setBilling((s) => ({ ...s, street1: v }))}
          required
        />
        <CheckoutField
          label="Street line 2"
          className="sm:col-span-2"
          value={billing.street2}
          onChange={(v) => setBilling((s) => ({ ...s, street2: v }))}
        />
        <CheckoutField
          label="City"
          value={billing.city}
          onChange={(v) => setBilling((s) => ({ ...s, city: v }))}
          required
        />
        <CheckoutField
          label="Region / State"
          value={billing.region}
          onChange={(v) => setBilling((s) => ({ ...s, region: v }))}
          required
        />
        <CheckoutField
          label="Region ID (optional)"
          value={billing.regionId}
          onChange={(v) => setBilling((s) => ({ ...s, regionId: v }))}
        />
        <CheckoutField
          label="ZIP / Postal code"
          value={billing.postcode}
          onChange={(v) => setBilling((s) => ({ ...s, postcode: v }))}
          required
        />
        <CheckoutField
          label="Country"
          value={billing.country_code}
          onChange={(v) => setBilling((s) => ({ ...s, country_code: v }))}
          required
        />
        <CheckoutField
          label="Phone"
          value={billing.telephone}
          onChange={(v) => setBilling((s) => ({ ...s, telephone: v }))}
          required
        />
      </div>
      <label className="mt-3 flex items-center gap-2">
        <input
          type="checkbox"
          checked={billingSaveBook}
          onChange={(e) => setBillingSaveBook(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-theme-primary"
        />
        <span className="text-sm">Save billing address to address book</span>
      </label>
    </section>
  );
}
