import React, { useMemo, memo } from "react";
import Link from "next/link";
import { InformationBox } from "@/src/components/account/InformationBox";
import { AddressStreetLines } from "@/src/components/account/address/shared/AddressStreetLines";
import { getBillingAddress, getShippingAddress } from "@/src/utils/addressHelpers";
import type { CustomerAddressNode } from "@/src/framework/graphql/customer/types";

const ACTION_LINK_CLASS =
  "action text-theme-primary flex no-wrap gap-2 items-baseline leading-[17px]";

type AddressBookProps = {
  addresses?: readonly CustomerAddressNode[] | null;
  billingActions?: React.ReactNode;
  shippingActions?: React.ReactNode;
};

type AddressDisplayProps = {
  address?: CustomerAddressNode;
};

type AddressBoxProps = {
  title: "Billing Address" | "Shipping Address";
  address?: CustomerAddressNode;
  actions?: React.ReactNode;
};

const AddressDisplay = memo(function AddressDisplay({ address }: AddressDisplayProps) {
  if (!address) {
    return <p className="text-gray-500">No address set</p>;
  }

  const { city, region, postcode, country_code, telephone } = address;

  return (
    <>
      <AddressStreetLines street={address.street} />
      <p>
        <span>{city}</span>
        {region?.region && <span>, {region.region}</span>}
        {postcode && <span> {postcode}</span>}
      </p>
      {country_code && <p>{country_code}</p>}
      {telephone && <p>{telephone}</p>}
    </>
  );
});
AddressDisplay.displayName = "AddressDisplay";

const AddressBox = memo(function AddressBox({ title, address, actions }: AddressBoxProps) {
  return (
    <InformationBox title={title} content={<AddressDisplay address={address} />} actions={actions} />
  );
});
AddressBox.displayName = "AddressBox";

function defaultAddressActions(address: CustomerAddressNode | undefined, label: string) {
  if (address?.id != null) {
    return (
      <Link href={`/account/addresses/edit/${address.id}`} className={ACTION_LINK_CLASS}>
        <i className="icon-edit" aria-hidden="true" />
        {label}
      </Link>
    );
  }
  return (
    <Link href="/account/addresses/new" className={ACTION_LINK_CLASS}>
      <i className="icon-edit" aria-hidden="true" />
      Add New Address
    </Link>
  );
}

/**
 * Default billing and shipping cards with optional overrides for `actions` slots.
 */
export const AddressBook = memo(function AddressBook({
  addresses,
  billingActions,
  shippingActions,
}: AddressBookProps) {
  const { billingAddress, shippingAddress } = useMemo(
    () => ({
      billingAddress: getBillingAddress(addresses),
      shippingAddress: getShippingAddress(addresses),
    }),
    [addresses],
  );

  const billingResolved = billingActions ?? defaultAddressActions(billingAddress, "Change Billing Address");
  const shippingResolved =
    shippingActions ?? defaultAddressActions(shippingAddress, "Change Shipping Address");

  return (
    <div className="block-content flex flex-wrap lg:no-wrap lg:gap-10">
      <AddressBox title="Billing Address" address={billingAddress} actions={billingResolved} />
      <AddressBox title="Shipping Address" address={shippingAddress} actions={shippingResolved} />
    </div>
  );
});
