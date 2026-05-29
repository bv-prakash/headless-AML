import type {
  CustomerDashboardRecentOrderItem,
  CustomerOrderLineItem,
  CustomerOrderListItem,
  OrderAddress,
  OrderMoney,
} from "@/src/framework/graphql/customer-orders/types";

/** Row total when the schema does not expose `prices.row_total` on order lines. */
export function lineRowTotalMoney(line: CustomerOrderLineItem): OrderMoney | null {
  const unit = line.product_sale_price;
  const qty = line.quantity_ordered;
  if (unit == null || qty == null || qty <= 0 || Number.isNaN(Number(qty))) return null;
  return {
    value: unit.value * Number(qty),
    currency: unit.currency,
  };
}

export function formatOrderMoney(m?: OrderMoney | null): string {
  if (!m) return "—";
  const currency = (m.currency || "USD").trim() || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      /** Prefer `$` over `US$` where the runtime would otherwise add a country prefix. */
      currencyDisplay: "narrowSymbol",
    }).format(m.value);
  } catch {
    return currency === "USD" ? `$${m.value}` : `${m.value} ${currency}`;
  }
}

/** Logged-in customer name for order list "Created By" (same as `customer { firstname lastname }`). */
export function formatCustomerFirstLast(
  firstname?: string | null,
  lastname?: string | null,
): string {
  const n = [firstname, lastname].filter((p) => (p ?? "").trim()).join(" ").trim();
  return n || "—";
}

/** "Created By" on dashboard: billing name when present, else account name. */
export function orderRowCreatedByDisplay(
  order: CustomerDashboardRecentOrderItem,
  accountFirst?: string | null,
  accountLast?: string | null,
): string {
  const bill = formatCustomerFirstLast(
    order.billing_address?.firstname,
    order.billing_address?.lastname,
  );
  if (bill !== "—") return bill;
  return formatCustomerFirstLast(accountFirst, accountLast);
}

export function formatOrderDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Luma-style short date (e.g. `3/19/26`). */
export function formatOrderDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
  });
}

/** Display ID column (Luma: increment / external id). */
export function orderDisplayId(order: CustomerOrderListItem): string {
  return (order.increment_id ?? "").trim() || order.number;
}

/** PO number when the API exposes it (custom modules); otherwise em dash. */
export function orderPoNumber(_order: CustomerOrderListItem): string {
  return "—";
}

export function formatAddressLines(addr: OrderAddress | null | undefined): string[] {
  if (!addr) return [];
  const lines: string[] = [];
  const name = [addr.firstname, addr.lastname].filter(Boolean).join(" ");
  if (name) lines.push(name);
  if (addr.company) lines.push(addr.company);
  if (addr.street?.length) lines.push(...addr.street);
  const cityLine = [addr.city, addr.region, addr.postcode].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (addr.country_code) lines.push(String(addr.country_code));
  if (addr.telephone) lines.push(addr.telephone);
  return lines;
}
