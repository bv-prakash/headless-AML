import React, { useMemo, memo } from "react";
import Link from "next/link";
import { AddressStreetLines } from "@/src/components/account/address/shared/AddressStreetLines";
import type { CustomerAddressNode } from "@/src/framework/graphql/queries/customerInfo";

type AddressTableProps = {
  addresses?: readonly CustomerAddressNode[] | null;
  onDelete?: (addressId: string | number) => void;
  isLoading?: boolean;
  /** For paginated lists: global row index for accessibility (default 0). */
  rowIndexOffset?: number;
};

type AddressRowProps = {
  address: CustomerAddressNode | undefined;
  index: number;
  onDelete?: (id: string | number) => void;
  isLoading?: boolean;
};

type ActionsCellProps = {
  addressId: string | number | undefined;
  index: number;
  onDelete?: (id: string | number) => void;
  isLoading?: boolean;
};

// CSS Constants
const CLASS = {
  TH: "px-5 py-3.5 text-left font-bold uppercase align-bottom",
  TD: "p-5",
  EMPTY: "text-center py-8",
  EMPTY_TEXT: "text-gray-500",
  TR: "border-b border-ccc hover:bg-f4f4f4",
  THEAD: "bg-f0f0f0 border-b-2 border-aaa",
  ACTION_LINK: "action text-theme-primary flex items-center gap-2 text-xs md:text-sm",
  ACTION_BTN: "action text-light-red hover:underline text-xs md:text-sm disabled:opacity-50",
  ACTION_CONTAINER: "flex gap-2 justify-center flex-wrap",
} as const;

// Table header configuration
const TABLE_HEADERS = [
  { key: "firstname", label: "First Name", className: "col firstname" },
  { key: "lastname", label: "Last Name", className: "col lastname" },
  { key: "streetaddress", label: "Street Address", className: "col streetaddress" },
  { key: "city", label: "City", className: "col city" },
  { key: "country", label: "Country", className: "col country" },
  { key: "state", label: "State", className: "col state" },
  { key: "zip", label: "Zip/Postal Code", className: "col zip" },
  { key: "phone", label: "Phone", className: "col phone" },
  { key: "actions", label: "Actions", className: "col actions" },
] as const;

// Address field accessors
const getAddressField = (address: CustomerAddressNode, field: string): React.ReactNode => {
  switch (field) {
    case "firstname":
      return address.firstname || "-";
    case "lastname":
      return address.lastname || "-";
    case "streetaddress":
      return address.street?.length ? <AddressStreetLines street={address.street} /> : "-";
    case "city":
      return address.city || "-";
    case "country":
      return address.country_code || "-";
    case "state":
      return address.region?.region || address.region?.region_code || "-";
    case "zip":
      return address.postcode || "-";
    case "phone":
      return address.telephone ? (
        <a href={`tel:${address.telephone}`}>
          {address.telephone}
        </a>
      ) : (
        "-"
      );
    default:
      return "-";
  }
};

/**
 * Empty state component
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className={CLASS.EMPTY}>
      <p className={CLASS.EMPTY_TEXT}>No addresses found</p>
    </div>
  );
});
EmptyState.displayName = "EmptyState";

/**
 * Action buttons cell
 */
const ActionsCell = memo(function ActionsCell({ addressId, index, onDelete, isLoading }: ActionsCellProps) {
  return (
    <div className={CLASS.ACTION_CONTAINER}>
      <Link
        href={`/account/addresses/edit/${addressId}`}
        className={CLASS.ACTION_LINK}
        title="Edit this address"
      >
        <i className="icon-edit"></i>
        <span className="sr-only">Edit</span>
      </Link>
      {onDelete && (
        <button
          onClick={() => onDelete(addressId || index)}
          disabled={isLoading}
          className={CLASS.ACTION_BTN}
          title="Delete this address"
          aria-label={`Delete address ${index + 1}`}
        >
          <i className="icon-delete"></i>
          <span className="sr-only">Delete</span>
        </button>
      )}
    </div>
  );
});
ActionsCell.displayName = "ActionsCell";

/**
 * Address table row component - rendered from TABLE_HEADERS config
 */
const AddressRow = memo(function AddressRow({ address, index, onDelete, isLoading }: AddressRowProps) {
  if (!address) return null;

  return (
    <tr className={CLASS.TR}>
      {TABLE_HEADERS.map((header) => (
        <td
          key={header.key}
          className={`${header.className} ${CLASS.TD} ${header.key === "actions" ? "text-center" : ""}`}
        >
          {header.key === "actions" ? (
            <ActionsCell addressId={address.id} index={index} onDelete={onDelete} isLoading={isLoading} />
          ) : (
            getAddressField(address, header.key)
          )}
        </td>
      ))}
    </tr>
  );
});
AddressRow.displayName = "AddressRow";

/**
 * Table header component - rendered from TABLE_HEADERS config
 */
const TableHeader = memo(function TableHeader() {
  return (
    <thead>
      <tr className={CLASS.THEAD}>
        {TABLE_HEADERS.map((header) => (
          <th
            key={header.key}
            scope="col"
            className={`${header.className} ${CLASS.TH} ${header.key === "actions" ? "text-center" : ""}`}
          >
            {header.label}
          </th>
        ))}
      </tr>
    </thead>
  );
});
TableHeader.displayName = "TableHeader";

/**
 * Main AddressTable component - displays all addresses in table format
 */
function AddressTableComponent({
  addresses,
  onDelete,
  isLoading = false,
  rowIndexOffset = 0,
}: AddressTableProps) {
  const hasAddresses = useMemo(() => addresses && addresses.length > 0, [addresses]);

  if (!hasAddresses) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto border border-aaa ">
      <table className="w-full border-collapse">
        <TableHeader />
        <tbody>
          {addresses &&
            addresses.map((address, idx) => (
              <AddressRow
                key={address?.id || idx}
                address={address}
                index={rowIndexOffset + idx}
                onDelete={onDelete}
                isLoading={isLoading}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}

export const AddressTable = memo(AddressTableComponent);
AddressTable.displayName = "AddressTable";
