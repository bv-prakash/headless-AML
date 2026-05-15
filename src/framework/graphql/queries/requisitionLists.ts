import { gql } from "@apollo/client";

/**
 * Customer requisition lists (paginated). Returns the rows that power the
 * `/account/requisition-lists` table — name, description, item count, and
 * last-activity timestamp. `id` on `customer` is required because Apollo's
 * cache uses it as the `Customer` keyField (see `apolloClient.ts`).
 */
export const CUSTOMER_REQUISITION_LISTS_QUERY = gql`
  query CustomerRequisitionLists($currentPage: Int!, $pageSize: Int!) {
    customer {
      id
      requisition_lists(currentPage: $currentPage, pageSize: $pageSize) {
        total_count
        items {
          uid
          name
          description
          items_count
          updated_at
        }
      }
    }
  }
`;

export type RequisitionListRow = {
  readonly uid: string;
  readonly name: string;
  readonly description: string | null;
  readonly items_count: number;
  readonly updated_at: string | null;
};

export type CustomerRequisitionListsVariables = {
  readonly currentPage: number;
  readonly pageSize: number;
};

export type CustomerRequisitionListsResponse = {
  readonly customer: {
    readonly id: number | string;
    readonly requisition_lists: {
      readonly total_count: number | null;
      readonly items: ReadonlyArray<RequisitionListRow> | null;
    } | null;
  } | null;
};

/**
 * Lightweight list used to populate Move / Copy destination dropdowns on the
 * detail page. Fetches just `uid` + `name` for up to 50 lists in one shot, so
 * the picker doesn't need its own pagination UI. Kept as a separate query
 * (rather than reusing {@link CUSTOMER_REQUISITION_LISTS_QUERY}) so it doesn't
 * collide with the listing page's paginated observer.
 */
export const CUSTOMER_REQUISITION_LISTS_PICKER_QUERY = gql`
  query CustomerRequisitionListsPicker {
    customer {
      id
      requisition_lists(currentPage: 1, pageSize: 50) {
        items {
          uid
          name
        }
      }
    }
  }
`;

export type RequisitionListPickerItem = {
  readonly uid: string;
  readonly name: string;
};

export type CustomerRequisitionListsPickerResponse = {
  readonly customer: {
    readonly id: number | string;
    readonly requisition_lists: {
      readonly items: ReadonlyArray<RequisitionListPickerItem> | null;
    } | null;
  } | null;
};

/** "Apr 24, 2026" — matches the Magento Luma "Latest Activity" column. */
export function formatRequisitionListActivity(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/* Detail view                                                         */
/* ------------------------------------------------------------------ */

/**
 * Single requisition list (looked up by `uid`). Magento's schema doesn't
 * expose a top-level `requisitionList(uid:)` query — we have to filter the
 * customer's paginated list by `{ uids: { eq: <uid> } }` and take the first
 * (and only) result.
 *
 * `items.items` returns `RequisitionListItemInterface` whose product comes
 * back as `ProductInterface`; we select only the fields the detail table
 * actually renders.
 */
export const CUSTOMER_REQUISITION_LIST_DETAIL_QUERY = gql`
  query CustomerRequisitionListDetail($uid: String!) {
    customer {
      id
      requisition_lists(filter: { uids: { eq: $uid } }, currentPage: 1, pageSize: 1) {
        items {
          uid
          name
          description
          items_count
          updated_at
          items {
            items {
              uid
              quantity
              product {
                __typename
                uid
                sku
                name
                url_key
                stock_status
                small_image {
                  url
                  label
                }
                price_range {
                  minimum_price {
                    final_price {
                      value
                      currency
                    }
                    regular_price {
                      value
                      currency
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export type RequisitionListItemProduct = {
  readonly __typename?: string | null;
  readonly uid: string;
  readonly sku: string;
  readonly name: string;
  readonly url_key?: string | null;
  readonly stock_status?: "IN_STOCK" | "OUT_OF_STOCK" | string | null;
  readonly small_image?: { readonly url?: string | null; readonly label?: string | null } | null;
  readonly price_range?: {
    readonly minimum_price: {
      readonly final_price: { readonly value: number | null; readonly currency: string | null };
      readonly regular_price: { readonly value: number | null; readonly currency: string | null };
    };
  } | null;
};

export type RequisitionListItem = {
  readonly uid: string;
  readonly quantity: number;
  readonly product: RequisitionListItemProduct | null;
};

export type RequisitionListDetail = RequisitionListRow & {
  readonly items: {
    readonly items: ReadonlyArray<RequisitionListItem> | null;
  } | null;
};

export type CustomerRequisitionListDetailVariables = {
  readonly uid: string;
};

export type CustomerRequisitionListDetailResponse = {
  readonly customer: {
    readonly id: number | string;
    readonly requisition_lists: {
      readonly items: ReadonlyArray<RequisitionListDetail> | null;
    } | null;
  } | null;
};

/** Magento ships price values in customer-store currency — minimal formatter. */
export function formatRequisitionListPrice(
  value: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency ?? ""}`.trim();
  }
}

