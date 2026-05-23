/** Keys we can express in `ProductAttributeSortInput` + optional client-side handling. */
export type ProductListSortKey =
  | "position"
  | "name"
  | "product_type"
  | "price";

const SORT_MAP: Record<ProductListSortKey, Record<string, string>> = {
  position: { position: "ASC" },
  name: { name: "ASC" },
  product_type: { position: "ASC" },
  price: { price: "ASC" },
};

/**
 * Magento `catalog_default_sort_by` / Luma sorter often uses values
 * outside our small set. Unknown tokens fall back to `position` so
 * GraphQL always receives a valid `sort` object.
 */
const MAGENTO_SORT_TO_KEY: Record<string, ProductListSortKey> = {
  position: "position",
  name: "name",
  price: "price",
  relevance: "position",
  best_value: "position",
  created_at: "position",
  entity_id: "position",
};

export function parseProductListSortParam(
  raw: string | string[] | undefined,
): ProductListSortKey {
  const rawStr = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase() ?? "";
  if (!rawStr) return "position";
  const mapped = MAGENTO_SORT_TO_KEY[rawStr];
  if (mapped) return mapped;
  if (rawStr in SORT_MAP) return rawStr as ProductListSortKey;
  return "position";
}

export function buildPlpProductSortInput(
  sortKey: ProductListSortKey,
): Record<string, string> {
  return SORT_MAP[sortKey];
}

const CLIENT_SIDE_FACET_CODES: ReadonlySet<string> = new Set(["product_type"]);

/**
 * @param categoryScopeUid When set (and no URL facet `category_uid`),
 *   scopes with `category_uid` instead of numeric `category_id` — some
 *   Magento / multi-store setups return no rows for `category_id` only.
 */
export function buildPlpProductAttributeFilter(
  categoryId: string,
  facets: Record<string, string[]>,
  categoryScopeUid?: string | null,
): Record<string, { eq?: string; in?: string[] }> {
  const filter: Record<string, { eq?: string; in?: string[] }> = {};

  const facetCatUid = facets.category_uid;
  const hasFacetCatUid = (facetCatUid?.length ?? 0) > 0;

  if (hasFacetCatUid) {
    const unique = [...new Set(facetCatUid!)].filter(Boolean);
    filter.category_uid =
      unique.length === 1 ? { eq: unique[0]! } : { in: unique };
  } else if (categoryScopeUid?.trim()) {
    filter.category_uid = { eq: categoryScopeUid.trim() };
  } else {
    filter.category_id = { eq: categoryId };
  }

  for (const [code, values] of Object.entries(facets)) {
    if (code === "category_id" || code === "category_uid") continue;
    const unique = [...new Set(values)].filter(Boolean);
    if (unique.length === 0) continue;
    filter[code] = unique.length === 1 ? { eq: unique[0] } : { in: unique };
  }

  return filter;
}

/** PLP list query — plain string for `JSON.stringify({ query })` (not `gql` / DocumentNode). */
export const PLP_PRODUCTS_BY_CATEGORY_QUERY = `
  query ProductsByCategory(
    $filter: ProductAttributeFilterInput!
    $pageSize: Int!
    $currentPage: Int!
    $sort: ProductAttributeSortInput
  ) {
    products(
      filter: $filter
      pageSize: $pageSize
      currentPage: $currentPage
      sort: $sort
    ) {
      aggregations {
        attribute_code
        count
        label
        options {
          label
          value
          count
        }
      }
      items {
        id
        __typename
        name
        sku
        url_key
        stock_status
        small_image {
          url
        }
        short_description {
          html
        }
        price_range {
          minimum_price {
            regular_price {
              value
              currency
            }
          }
        }
      }
      total_count
    }
  }
`;

export type MagentoProductsByCategoryVariables = {
  readonly filter: Record<string, { eq?: string; in?: string[] }>;
  readonly pageSize: number;
  readonly currentPage: number;
  readonly sort: Record<string, string>;
};

/**
 * Builds the exact `variables` object sent to Magento for PLP (after
 * stripping client-only facets).
 */
export function toMagentoProductsByCategoryVariables(input: {
  readonly categoryId: string;
  /** Prefer this for `filter.category_uid` instead of `category_id` when no facet `category_uid`. */
  readonly categoryScopeUid?: string | null;
  readonly filterFacets: Record<string, string[]>;
  readonly pageSize: number;
  readonly currentPage: number;
  readonly sort: ProductListSortKey;
}): MagentoProductsByCategoryVariables {
  const serverFacets = Object.fromEntries(
    Object.entries(input.filterFacets).filter(
      ([code]) => !CLIENT_SIDE_FACET_CODES.has(code),
    ),
  );
  const sortKey = input.sort ?? "position";
  return {
    filter: buildPlpProductAttributeFilter(
      input.categoryId,
      serverFacets,
      input.categoryScopeUid,
    ),
    pageSize: input.pageSize,
    currentPage: input.currentPage,
    sort: buildPlpProductSortInput(sortKey),
  };
}
