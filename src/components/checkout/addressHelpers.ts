import type { CartAddressInput } from "@/src/framework/graphql/mutations/checkoutMutations";
import type { CustomerAddressNode } from "@/src/framework/graphql/queries/customerCheckout";
import type { AddressFormState } from "@/src/components/checkout/addressTypes";

export function toCartAddressInput(
  f: AddressFormState,
  saveInAddressBook: boolean,
): CartAddressInput {
  const street = [f.street1.trim(), f.street2.trim()].filter(Boolean);
  const region_id =
    f.regionId.trim() === "" ? undefined : Number.parseInt(f.regionId, 10);
  return {
    firstname: f.firstname.trim(),
    lastname: f.lastname.trim(),
    ...(f.company.trim() ? { company: f.company.trim() } : {}),
    street: street.length ? street : [""],
    city: f.city.trim(),
    region: f.region.trim(),
    ...(region_id != null && !Number.isNaN(region_id)
      ? { region_id }
      : {}),
    postcode: f.postcode.trim(),
    country_code: f.country_code.trim() || "US",
    telephone: f.telephone.trim(),
    save_in_address_book: saveInAddressBook,
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
