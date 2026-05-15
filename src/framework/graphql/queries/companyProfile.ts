import { gql } from "@apollo/client";

/**
 * Magento B2B Company module — fetches the authenticated customer's company
 * profile. The root `company` query has no args; Magento resolves it from
 * the customer auth token. Returns `null` for non-B2B / non-member customers.
 *
 * `company_admin` selects `id` because Apollo's cache treats `Customer` as a
 * keyed entity (`Customer.keyFields = ["id"]`) and would otherwise log
 * `Missing field 'id' while extracting keyFields`.
 */
export const COMPANY_PROFILE_QUERY = gql`
  query CompanyProfile {
    company {
      id
      name
      legal_name
      email
      vat_tax_id
      reseller_id
      payment_methods
      company_admin {
        id
        firstname
        lastname
        email
      }
      sales_representative {
        firstname
        lastname
        email
      }
    }
  }
`;

export type CompanyAdmin = {
  readonly id: number | string;
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly email: string | null;
};

export type CompanySalesRepresentative = {
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly email: string | null;
};

export type CompanyProfile = {
  readonly id: string;
  readonly name: string | null;
  readonly legal_name: string | null;
  readonly email: string | null;
  readonly vat_tax_id: string | null;
  readonly reseller_id: string | null;
  readonly payment_methods: ReadonlyArray<string> | null;
  readonly company_admin: CompanyAdmin | null;
  readonly sales_representative: CompanySalesRepresentative | null;
};

export type CompanyProfileResponse = {
  readonly company: CompanyProfile | null;
};

/** "John Smith" with graceful fallback for partial Magento data. */
export function formatPersonName(p: {
  readonly firstname?: string | null;
  readonly lastname?: string | null;
} | null | undefined): string {
  if (!p) return "—";
  const parts = [p.firstname, p.lastname].filter((s): s is string => !!s && s.trim() !== "");
  return parts.length > 0 ? parts.join(" ") : "—";
}

/**
 * Magento returns payment method codes (`"checkmo"`, `"banktransfer"`, etc.)
 * with no labels. This light-weight humaniser handles the built-in codes and
 * falls back to title-casing the code for any custom methods.
 */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  checkmo: "Check / Money order",
  banktransfer: "Bank Transfer Payment",
  cashondelivery: "Cash on Delivery",
  purchaseorder: "Purchase Order",
  companycredit: "Payment on Account",
  free: "No Payment Information Required",
};

export function paymentMethodLabel(code: string): string {
  const key = code.trim().toLowerCase();
  if (PAYMENT_METHOD_LABELS[key]) return PAYMENT_METHOD_LABELS[key];
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Built-in shipping method codes that Magento ships with. Custom carriers
 * (the merchant's `oracle_shipping`, `al_custom_shipping`, etc.) fall through
 * to the title-case humaniser.
 */
const SHIPPING_METHOD_LABELS: Record<string, string> = {
  flatrate: "Flat Rate",
  tablerate: "Table Rate",
  freeshipping: "Free Shipping",
  bestway: "Best Way",
  ups: "United Parcel Service",
  usps: "United States Postal Service",
  fedex: "Federal Express",
  dhl: "DHL",
  pickup: "Pickup From Store",
};

export function shippingMethodLabel(code: string): string {
  const key = code.trim().toLowerCase();
  if (SHIPPING_METHOD_LABELS[key]) return SHIPPING_METHOD_LABELS[key];
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Response shape from `/api/company/advanced-settings`. */
export type CompanyAdvancedSettings = {
  readonly shipping_methods: ReadonlyArray<string> | null;
  readonly applicable: "all" | "selected" | null;
  readonly code?: string;
};
