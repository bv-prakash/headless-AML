import { formatPrice } from "@/src/utils/format";
import type { ShippingMethodOnAddress } from "@/src/framework/graphql/mutations/checkoutMutations";

/** Stable key for carrier + method (codes are delimiter-safe in Magento). */
export function shippingMethodKey(m: ShippingMethodOnAddress): string {
  return `${m.carrier_code}\u0001${m.method_code}`;
}

export function parseShippingMethodKey(key: string): {
  carrier_code: string;
  method_code: string;
} {
  const i = key.indexOf("\u0001");
  return {
    carrier_code: i === -1 ? key : key.slice(0, i),
    method_code: i === -1 ? "" : key.slice(i + 1),
  };
}

export function shippingMethodLabel(m: ShippingMethodOnAddress): string {
  const title =
    [m.carrier_title, m.method_title].filter(Boolean).join(" — ") ||
    `${m.carrier_code} / ${m.method_code}`;
  if (m.amount != null) {
    return `${title} (${formatPrice(m.amount.value, m.amount.currency)})`;
  }
  return title;
}
