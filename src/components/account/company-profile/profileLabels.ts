/** "John Smith" with graceful fallback for partial Magento data. */
export function formatPersonName(p: {
  readonly firstname?: string | null;
  readonly lastname?: string | null;
} | null | undefined): string {
  if (!p) return "—";
  const parts = [p.firstname, p.lastname].filter(
    (s): s is string => !!s && s.trim() !== "",
  );
  return parts.length > 0 ? parts.join(" ") : "—";
}

/**
 * Magento returns payment method codes (`"checkmo"`, `"banktransfer"`,
 * etc.) with no labels. This humaniser handles the built-in codes and
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
 * Built-in shipping method codes that Magento ships with. Custom
 * carriers (e.g. `oracle_shipping`, `al_custom_shipping`) fall through
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
