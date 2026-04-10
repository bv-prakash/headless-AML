"use client";

import type { Dispatch, Ref, SetStateAction } from "react";
import ShippingAddressFields from "@/src/components/checkout/ShippingAddressFields";
import type { ShippingAddressFieldsHandle } from "@/src/components/checkout/ShippingAddressFields";
import type { AddressFormState } from "@/src/components/checkout/addressTypes";

type NewShippingAddressModalProps = {
  readonly shipping: AddressFormState;
  readonly setShipping: Dispatch<SetStateAction<AddressFormState>>;
  readonly onClose: () => void;
  readonly shippingAddressFormRef?: Ref<ShippingAddressFieldsHandle | null>;
  readonly saveInAddressBook?: boolean;
  readonly onSaveInAddressBookChange?: (value: boolean) => void;
};

export default function NewShippingAddressModal({
  shipping,
  setShipping,
  onClose,
  shippingAddressFormRef,
  saveInAddressBook,
  onSaveInAddressBookChange,
}: NewShippingAddressModalProps) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-shipping-address-title"
        className="relative z-10 w-full max-w-lg max-h-[min(90vh,720px)] overflow-y-auto rounded-lg bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-3 mb-4">
          <h3
            id="new-shipping-address-title"
            className="text-lg font-bold text-black uppercase"
          >
            New shipping address
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-black hover:text-theme-primary shrink-0 p-1 -mr-1"
            aria-label="Close"
          >
            <i className="icon-cross-icon text-[22px] leading-1" aria-hidden />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Enter a new shipping address. It will be used for this order.
        </p>
        <ShippingAddressFields
          ref={shippingAddressFormRef}
          shipping={shipping}
          setShipping={setShipping}
          showSaveInAddressBook
          saveInAddressBook={saveInAddressBook}
          onSaveInAddressBookChange={onSaveInAddressBookChange}
        />
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 text-base font-semibold border border-aaa bg-white text-gray-800 hover:bg-gray-50"
          >
            Use a saved address
          </button>
        </div>
      </div>
    </div>
  );
}
