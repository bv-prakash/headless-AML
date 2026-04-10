import type { CartAddressInput } from "@/src/framework/graphql/mutations/checkoutMutations";
import type { CreateCustomerAddressInput } from "@/src/framework/graphql/mutations/customerAddressMutations";
import type { CustomerAddressNode } from "@/src/framework/graphql/queries/customerCheckout";
import type { AddressFormState } from "@/src/components/checkout/addressTypes";

/** Magento `CustomerAddressInput` when checkout adds `region` (can include `region_id`). */
export type CreateCustomerAddressPayload = CreateCustomerAddressInput & {
  readonly region?: {
    readonly region?: string;
    readonly region_code?: string;
    readonly region_id?: number;
  };
};

export type CreateCustomerAddressMutationVariables = {
  readonly input: CreateCustomerAddressPayload;
};

export function toCartAddressInput(
  f: AddressFormState,
  saveInAddressBook: boolean,
  resolvedRegionId?: number | null,
): CartAddressInput {
  const street = [f.street1.trim(), f.street2.trim()].filter(Boolean);
  const rid =
    resolvedRegionId != null && !Number.isNaN(Number(resolvedRegionId))
      ? Number(resolvedRegionId)
      : undefined;
  return {
    firstname: f.firstname.trim(),
    lastname: f.lastname.trim(),
    ...(f.company.trim() ? { company: f.company.trim() } : {}),
    street: street.length ? street : [""],
    city: f.city.trim(),
    region: f.region.trim(),
    ...(rid != null ? { region_id: rid } : {}),
    postcode: f.postcode.trim(),
    country_code: f.country_code.trim() || "US",
    telephone: f.telephone.trim(),
    save_in_address_book: saveInAddressBook,
  };
}

function buildCustomerRegion(
  f: AddressFormState,
  resolvedRegionId?: number | null,
): NonNullable<CreateCustomerAddressPayload["region"]> | undefined {
  const rid =
    resolvedRegionId != null && !Number.isNaN(Number(resolvedRegionId))
      ? Number(resolvedRegionId)
      : undefined;
  const r = f.region.trim();
  if (r === "" && rid == null) return undefined;
  const isTwoLetter = /^[a-z]{2}$/i.test(r);
  if (rid != null) {
    return {
      region_id: rid,
      ...(r ? { region: r } : {}),
    };
  }
  return isTwoLetter
    ? { region_code: r.toUpperCase(), region: r.toUpperCase() }
    : { region: r };
}

export function toCreateCustomerAddressInput(
  f: AddressFormState,
  flags: {
    readonly default_shipping?: boolean;
    readonly default_billing?: boolean;
  },
  resolvedRegionId?: number | null,
): CreateCustomerAddressPayload {
  const street = [f.street1.trim(), f.street2.trim()].filter(Boolean);
  const region = buildCustomerRegion(f, resolvedRegionId);
  return {
    firstname: f.firstname.trim(),
    lastname: f.lastname.trim(),
    ...(f.company.trim() ? { company: f.company.trim() } : {}),
    country_code: f.country_code.trim() || "US",
    street: street.length ? street : [""],
    city: f.city.trim(),
    postcode: f.postcode.trim(),
    telephone: f.telephone.trim(),
    ...(region != null ? { region } : {}),
    default_shipping: flags.default_shipping,
    default_billing: flags.default_billing,
  };
}

export function formatCustomerAddressSummary(addr: CustomerAddressNode): string {
  const name = [addr.firstname, addr.lastname].filter(Boolean).join(" ");
  const street = addr.street?.filter(Boolean).join(", ") ?? "";
  const region =
    addr.region?.region_code || addr.region?.region || "";
  const tail = [addr.city, region, addr.postcode, addr.country_code]
    .filter(Boolean)
    .join(", ");
  return [name, street, tail].filter(Boolean).join(" · ");
}

export function formatShippingFormSummary(f: AddressFormState): string {
  const name = [f.firstname, f.lastname].filter(Boolean).join(" ");
  const street = [f.street1, f.street2].filter(Boolean).join(", ");
  const tail = [f.city, f.region, f.postcode, f.country_code]
    .filter(Boolean)
    .join(", ");
  return [name, street, tail].filter(Boolean).join(" · ");
}

/** GraphQL may return address `id` as string or number — normalize for comparisons */
export function sameAddressId(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
): boolean {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

/** Pick the saved book row that matches the shipping form after `save_in_address_book` + refetch. */
export function findCustomerAddressMatchingForm(
  addresses: readonly CustomerAddressNode[],
  f: AddressFormState,
): CustomerAddressNode | undefined {
  const pc = f.postcode.trim().toLowerCase();
  const s1 = f.street1.trim().toLowerCase();
  const city = f.city.trim().toLowerCase();
  if (!pc || !s1) return undefined;
  return addresses.find((a) => {
    const ap = (a.postcode ?? "").trim().toLowerCase();
    const aStreet = (a.street?.[0] ?? "").trim().toLowerCase();
    const ac = (a.city ?? "").trim().toLowerCase();
    return ap === pc && aStreet === s1 && ac === city;
  });
}
