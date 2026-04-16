/**
 * Storefront customer orders via `customer { orders { ... } }` on the Adobe Commerce GraphQL schema.
 *
 * Canonical documentation (overview, endpoints, headers, introspection, versioned reference):
 * https://developer.adobe.com/commerce/webapi/graphql/
 *
 * Related schema topics: Customer (`customer` query), Orders (`reorderItems`, etc.). Field availability
 * depends on your Commerce edition and release; confirm with introspection or the reference matching
 * your server version (for example 2.4.8 under “Reference” on the same site).
 */
import { gql } from "@apollo/client";

/** Money fragment reused on orders. */
const MONEY = `
  value
  currency
`;

/**
 * Shared order fields for list + detail. Do not add `customer_info` here: it is not on
 * `CustomerOrder` in standard Magento GraphQL (only appears if you extend the schema).
 */
const CUSTOMER_ORDER_SUMMARY_FIELDS = `
  id
  number
  increment_id
  order_date
  status
  total {
    grand_total {
      ${MONEY}
    }
  }
`;

/** Customer order list (newest first). */
export const CUSTOMER_ORDERS_QUERY = gql`
  query CustomerOrdersList {
    customer {
      id
      firstname
      lastname
      orders(
        pageSize: 50
        currentPage: 1
        sort: { sort_field: CREATED_AT, sort_direction: DESC }
      ) {
        total_count
        items {
          ${CUSTOMER_ORDER_SUMMARY_FIELDS}
        }
      }
    }
  }
`;

/** Account dashboard: latest orders (Luma `block-dashboard-orders`). */
export const CUSTOMER_DASHBOARD_RECENT_ORDERS_QUERY = gql`
  query CustomerDashboardRecentOrders {
    customer {
      id
      firstname
      lastname
      orders(
        pageSize: 5
        currentPage: 1
        sort: { sort_field: CREATED_AT, sort_direction: DESC }
      ) {
        items {
          id
          number
          increment_id
          order_date
          status
          billing_address {
            firstname
            lastname
          }
          total {
            grand_total {
              ${MONEY}
            }
          }
        }
      }
    }
  }
`;

export type OrderMoney = {
  readonly value: number;
  readonly currency: string;
};

export type CustomerOrderListItem = {
  readonly id: string;
  readonly number: string;
  readonly increment_id?: string | null;
  readonly order_date: string;
  readonly status: string;
  readonly total?: {
    readonly grand_total?: OrderMoney | null;
  } | null;
};

export type CustomerOrdersData = {
  readonly customer?: {
    readonly id?: string | number | null;
    readonly firstname?: string | null;
    readonly lastname?: string | null;
    readonly orders?: {
      readonly total_count?: number | null;
      readonly items: readonly CustomerOrderListItem[];
    } | null;
  } | null;
};

export const CUSTOMER_ORDER_DETAIL_QUERY = gql`
  query CustomerOrderDetailByNumber($orderNumber: String!) {
    customer {
      id
      firstname
      lastname
      orders(filter: { number: { eq: $orderNumber } }, pageSize: 1) {
        items {
          ${CUSTOMER_ORDER_SUMMARY_FIELDS}
          shipping_method
          carrier
          payment_methods {
            name
            type
          }
          total {
            subtotal {
              ${MONEY}
            }
            total_tax {
              ${MONEY}
            }
            total_shipping {
              ${MONEY}
            }
            grand_total {
              ${MONEY}
            }
          }
          billing_address {
            firstname
            lastname
            company
            street
            city
            region
            postcode
            country_code
            telephone
          }
          shipping_address {
            firstname
            lastname
            company
            street
            city
            region
            postcode
            country_code
            telephone
          }
          items {
            id
            product_name
            product_sku
            product_url_key
            quantity_ordered
            product_sale_price {
              ${MONEY}
            }
          }
          invoices {
            id
            number
            total {
              grand_total {
                ${MONEY}
              }
            }
          }
          shipments {
            id
            number
            tracking {
              title
              carrier
              number
            }
            items {
              id
              product_name
              product_sku
              quantity_shipped
            }
          }
          credit_memos {
            id
            number
            total {
              grand_total {
                ${MONEY}
              }
            }
          }
        }
      }
    }
  }
`;

export type OrderAddress = {
  readonly firstname?: string | null;
  readonly lastname?: string | null;
  readonly company?: string | null;
  readonly street?: readonly string[] | null;
  readonly city?: string | null;
  readonly region?: string | null;
  readonly postcode?: string | null;
  readonly country_code?: string | null;
  readonly telephone?: string | null;
};

export type CustomerDashboardRecentOrderItem = CustomerOrderListItem & {
  readonly billing_address?: OrderAddress | null;
};

export type CustomerDashboardRecentOrdersData = {
  readonly customer?: {
    readonly firstname?: string | null;
    readonly lastname?: string | null;
    readonly orders?: {
      readonly items: readonly CustomerDashboardRecentOrderItem[];
    } | null;
  } | null;
};

export type CustomerOrderLineItem = {
  readonly id: string;
  readonly product_name?: string | null;
  readonly product_sku: string;
  readonly product_url_key?: string | null;
  readonly quantity_ordered?: number | null;
  readonly product_sale_price?: OrderMoney | null;
};

export type CustomerOrderInvoice = {
  readonly id: string;
  readonly number: string;
  readonly total?: {
    readonly grand_total?: OrderMoney | null;
  } | null;
};

export type CustomerOrderShipmentTracking = {
  readonly title: string;
  readonly carrier: string;
  readonly number?: string | null;
};

export type CustomerOrderShipmentItem = {
  readonly id: string;
  readonly product_name?: string | null;
  readonly product_sku: string;
  readonly quantity_shipped?: number | null;
};

export type CustomerOrderShipment = {
  readonly id: string;
  readonly number: string;
  readonly tracking?: readonly CustomerOrderShipmentTracking[] | null;
  readonly items?: readonly CustomerOrderShipmentItem[] | null;
};

export type CustomerOrderCreditMemo = {
  readonly id: string;
  readonly number: string;
  readonly total?: {
    readonly grand_total?: OrderMoney | null;
  } | null;
};

export type OrderPaymentMethodRow = {
  readonly name?: string | null;
  readonly type?: string | null;
};

export type CustomerOrderDetail = CustomerOrderListItem & {
  readonly shipping_method?: string | null;
  readonly carrier?: string | null;
  readonly payment_methods?: readonly OrderPaymentMethodRow[] | null;
  readonly total?: {
    /** Deprecated in Magento GraphQL docs but widely available (replaces `subtotal_excl_tax` on older APIs). */
    readonly subtotal?: OrderMoney | null;
    readonly total_tax?: OrderMoney | null;
    readonly total_shipping?: OrderMoney | null;
    readonly grand_total?: OrderMoney | null;
  } | null;
  readonly billing_address?: OrderAddress | null;
  readonly shipping_address?: OrderAddress | null;
  readonly items?: readonly CustomerOrderLineItem[] | null;
  readonly invoices?: readonly CustomerOrderInvoice[] | null;
  readonly shipments?: readonly CustomerOrderShipment[] | null;
  readonly credit_memos?: readonly CustomerOrderCreditMemo[] | null;
};

export type CustomerOrderDetailData = {
  readonly customer?: {
    readonly firstname?: string | null;
    readonly lastname?: string | null;
    readonly orders?: {
      readonly items: readonly CustomerOrderDetail[];
    } | null;
  } | null;
};

export type CustomerOrderDetailVariables = {
  readonly orderNumber: string;
};

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

/** Logged-in customer name for order list “Created By” (same as `customer { firstname lastname }`). */
export function formatCustomerFirstLast(
  firstname?: string | null,
  lastname?: string | null,
): string {
  const n = [firstname, lastname].filter((p) => (p ?? "").trim()).join(" ").trim();
  return n || "—";
}

/** “Created By” on dashboard: billing name when present, else account name. */
export function orderRowCreatedByDisplay(
  order: CustomerDashboardRecentOrderItem,
  accountFirst?: string | null,
  accountLast?: string | null,
): string {
  const bill = formatCustomerFirstLast(order.billing_address?.firstname, order.billing_address?.lastname);
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
