import type { CartAddressInput } from "@/src/framework/graphql/checkout/types";
import type { CreateCustomerAddressInput } from "@/src/framework/graphql/customer-addresses/mutations/createCustomerAddress";
import type { CustomerAddressNode } from "@/src/framework/graphql/customer/types";
import type { DirectoryRegionNode } from "@/src/framework/graphql/customer-addresses/queries/getCountryRegions";
import type { AddressFormState } from "@/src/components/checkout/address/addressTypes";

/**
 * Maps the shopper’s state/province text to Magento’s directory `region_id` when the country
 * has `available_regions`. Required for countries where the API rejects saves without `region_id`.
 */
export function resolveDirectoryRegionId(
  regionInput: string,
  availableRegions?: readonly DirectoryRegionNode[] | null,
): number | null {
  const list = availableRegions ?? [];
  if (!list.length) return null;
  const trimmed = regionInput.trim();
  if (!trimmed) return null;

  /** Magento Luma `region_id` select uses numeric string option values. */
  if (/^\d+$/.test(trimmed)) {
    const byId = list.find((r) => String(r.id) === trimmed);
    if (byId) {
      const id = Number(byId.id);
      return Number.isFinite(id) ? id : null;
    }
    return null;
  }

  const t = trimmed.toLowerCase();
  const byCode = list.find((r) => (r.code ?? "").trim().toLowerCase() === t);
  if (byCode) {
    const id = Number(byCode.id);
    return Number.isFinite(id) ? id : null;
  }
  const byName = list.find((r) => (r.name ?? "").trim().toLowerCase() === t);
  if (byName) {
    const id = Number(byName.id);
    return Number.isFinite(id) ? id : null;
  }
  return null;
}

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
export function customerAddressToFormState(addr: CustomerAddressNode): AddressFormState {
  const street = addr.street ?? [];
  const rid = addr.region?.region_id;
  const regionLabel =
    rid != null && !Number.isNaN(Number(rid))
      ? String(Number(rid))
      : (addr.region?.region_code ?? "").trim() ||
        (addr.region?.region ?? "").trim();
  return {
    firstname: (addr.firstname ?? "").trim(),
    lastname: (addr.lastname ?? "").trim(),
    company: "",
    street1: (street[0] ?? "").trim(),
    street2: (street[1] ?? "").trim(),
    city: (addr.city ?? "").trim(),
    region: regionLabel,
    postcode: (addr.postcode ?? "").trim(),
    country_code: ((addr.country_code ?? "US").trim().toUpperCase() || "US").slice(0, 2),
    telephone: (addr.telephone ?? "").trim(),
  };
}

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
