"use client";

import { useParams } from "next/navigation";
import { AddressBookForm } from "@/src/components/account/address/AddressBookForm";

export default function EditAddressPage() {
  const params = useParams();
  const raw = params?.addressId;
  const segment = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(segment);
  const addressId = Number.isFinite(id) && id > 0 ? id : NaN;

  if (Number.isNaN(addressId)) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl leading-[1.1] mb-5 mt-0 font-semibold md:text-[26px] lg-custom:text-[32px]! uppercase border-b border-aaa pt-2.5 md:pt-0 pb-[15px]">
          Edit Address
        </h1>
        <p className="text-gray-700">Invalid address link.</p>
      </div>
    );
  }

  return <AddressBookForm mode="edit" addressId={addressId} />;
}
