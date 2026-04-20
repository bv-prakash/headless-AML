import React, { useMemo, memo } from "react";
import { InformationBox } from "@/src/components/account/InformationBox";
import { getBillingAddress, getShippingAddress } from "@/src/utils/addressHelpers";
import type { CustomerAddressNode } from "@/src/framework/graphql/queries/customerInfo";

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

/**
 * Renders formatted address details
 */
const AddressDisplay = memo(function AddressDisplay({ address }: AddressDisplayProps) {
  if (!address) {
    return <p className="text-gray-500">No address set</p>;
  }

  const { street, city, region, postcode, country_code, telephone } = address;

  return (
    <>
      {street && street.length > 0 && (
        <>
          {street.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </>
      )}
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

/**
 * Individual address box component
 */
const AddressBox = memo(function AddressBox({ title, address, actions }: AddressBoxProps) {
  return (
    <InformationBox
      title={title}
      content={<AddressDisplay address={address} />}
      actions={actions}
    />
  );
});
AddressBox.displayName = "AddressBox";

/**
 * AddressBook component - displays default billing and shipping addresses in card format
 */
export const AddressBook = memo(function AddressBook({
  addresses,
  billingActions,
  shippingActions,
}: AddressBookProps) {
  // Extract default addresses - memoized to avoid recalculation
  const { billingAddress, shippingAddress } = useMemo(() => ({
    billingAddress: getBillingAddress(addresses),
    shippingAddress: getShippingAddress(addresses),
  }), [addresses]);

  return (
    <div className="block-content flex flex-wrap lg:no-wrap lg:gap-10">
      <AddressBox title="Billing Address" address={billingAddress} actions={billingActions} />
      <AddressBox title="Shipping Address" address={shippingAddress} actions={shippingActions} />
    </div>
  );
});
