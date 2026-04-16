import type { CustomerAddressNode } from "@/src/framework/graphql/queries/customerInfo";

/**
 * Address utility functions for DRY principle
 */

/**
 * Find the default billing address
 */
export const getBillingAddress = (addresses?: readonly CustomerAddressNode[] | null): CustomerAddressNode | undefined =>
  addresses?.find((addr) => addr?.default_billing);

/**
 * Find the default shipping address
 */
export const getShippingAddress = (addresses?: readonly CustomerAddressNode[] | null): CustomerAddressNode | undefined =>
  addresses?.find((addr) => addr?.default_shipping);

/**
 * Extract all address fields with fallback to default values
 */
export const extractAddressFields = (address?: CustomerAddressNode) => ({
  firstname: address?.firstname || "-",
  lastname: address?.lastname || "-",
  street: address?.street || [],
  city: address?.city || "-",
  country: address?.country_code || "-",
  state: address?.region?.region || address?.region?.region_code || "-",
  zip: address?.postcode || "-",
  phone: address?.telephone || null,
});

/**
 * Format full address as a string
 */
export const formatAddressString = (address?: CustomerAddressNode): string => {
  if (!address) return "No address set";

  const parts = [
    address.firstname && address.lastname ? `${address.firstname} ${address.lastname}` : "",
    address.street?.join(", ") || "",
    address.city,
    address.region?.region || address.region?.region_code,
    address.postcode,
    address.country_code,
  ].filter(Boolean);

  return parts.join(", ");
};

/**
 * Check if address has complete information
 */
export const isAddressComplete = (address?: CustomerAddressNode): boolean => {
  return !!(address?.firstname && address?.street?.length && address?.city && address?.postcode && address?.country_code);
};

/**
 * Get address type (billing/shipping or both)
 */
export const getAddressType = (address?: CustomerAddressNode): "billing" | "shipping" | "both" | "none" => {
  if (!address) return "none";
  if (address.default_billing && address.default_shipping) return "both";
  if (address.default_billing) return "billing";
  if (address.default_shipping) return "shipping";
  return "none";
};
