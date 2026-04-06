import { magentoGraphqlFetch } from "@/src/framework/graphql/magentoGraphqlFetch";
import { formatProductTypeLabel } from "@/src/framework/graphql/constants/productTypes";

// ── Constants ──────────────────────────────────────────────

const DEFAULT_REVALIDATE_SECONDS = 0;
const CLIENT_SIDE_FACET_CODES: ReadonlySet<string> = new Set(["product_type"]);
export const FACET_PARAM_PREFIX = "f_";

// ── Sort ───────────────────────────────────────────────────

export type ProductListSortKey = "position" | "name" | "product_type";

const SORT_MAP: Record<ProductListSortKey, Record<string, string>> = {
  position: { position: "ASC" },
  name: { name: "ASC" },
  product_type: { position: "ASC" },
};

export function parseProductListSortParam(
  raw: string | string[] | undefined,
): ProductListSortKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v && v in SORT_MAP ? (v as ProductListSortKey) : "position";
}

function buildProductSortInput(
  sortKey: ProductListSortKey,
): Record<string, string> {
  return SORT_MAP[sortKey];
}

// ── Facet Parsing ──────────────────────────────────────────

export function parseFacetSearchParams(
  sp: Record<string, string | string[] | undefined>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};

  for (const [key, val] of Object.entries(sp)) {
    if (!key.startsWith(FACET_PARAM_PREFIX)) continue;
    const code = key.slice(FACET_PARAM_PREFIX.length);
    if (!code) continue;

    const raw = Array.isArray(val) ? val.join(",") : (val ?? "");
    const values = [
      ...new Set(raw.split(/[,+]/).map((s) => s.trim()).filter(Boolean)),
    ];

    if (values.length) out[code] = values;
  }

  return out;
}

function buildProductFilterInput(
  categoryId: string,
  facets: Record<string, string[]>,
): Record<string, { eq?: string; in?: string[] }> {
  const hasCategoryUid = (facets.category_uid?.length ?? 0) > 0;

  const filter: Record<string, { eq?: string; in?: string[] }> = hasCategoryUid
    ? {}
    : { category_id: { eq: categoryId } };

  for (const [code, values] of Object.entries(facets)) {
    if (code === "category_id") continue;
    const unique = [...new Set(values)].filter(Boolean);
    if (unique.length === 0) continue;
    filter[code] = unique.length === 1 ? { eq: unique[0] } : { in: unique };
  }

  return filter;
}

// ── Types ──────────────────────────────────────────────────

export type ProductStockStatus = "IN_STOCK" | "OUT_OF_STOCK";

type ProductListItem = {
  readonly id: number;
  readonly __typename: string;
  readonly name: string;
  readonly sku: string;
  readonly url_key: string;
  readonly stock_status: ProductStockStatus;
  readonly small_image?: { readonly url?: string | null } | null;
  readonly short_description?: { readonly html?: string | null } | null;
  readonly price_range?: {
    readonly minimum_price?: {
      readonly regular_price?: {
        readonly value?: number | null;
        readonly currency?: string | null;
      } | null;
    } | null;
  } | null;
};

type AggregationOption = {
  readonly label?: string | null;
  readonly value?: string | null;
  readonly count?: number | null;
};

export type ProductAggregation = {
  readonly attribute_code?: string | null;
  readonly count?: number | null;
  readonly label?: string | null;
  readonly options?: readonly AggregationOption[] | null;
};

type ProductsByCategoryVariables = {
  readonly categoryId: string;
  readonly pageSize: number;
  readonly currentPage: number;
  readonly sort?: ProductListSortKey;
  readonly filterFacets?: Record<string, string[]>;
  readonly childCategoryIds?: readonly number[];
  readonly childCategoryUids?: readonly string[];
};

type ProductsByCategoryResponse = {
  products: {
    aggregations?: readonly ProductAggregation[] | null;
    items: readonly ProductListItem[];
    total_count: number;
  };
};

// ── GraphQL Query ──────────────────────────────────────────

const PRODUCTS_BY_CATEGORY_QUERY = `
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

// ── Aggregation Helpers ────────────────────────────────────

function buildProductTypeAggregation(
  items: readonly ProductListItem[],
): ProductAggregation {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.__typename, (counts.get(item.__typename) ?? 0) + 1);
  }

  const options = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([typeName, count]) => ({
      label: formatProductTypeLabel(typeName),
      value: typeName,
      count,
    }));

  return {
    attribute_code: "product_type",
    count: options.length,
    label: "Product Type",
    options,
  };
}

function filterCategoryAggregations(
  aggregations: readonly ProductAggregation[],
  allowedIds: ReadonlySet<string>,
  allowedUids: ReadonlySet<string>,
): ProductAggregation[] {
  return aggregations.map((agg) => {
    const code = agg.attribute_code ?? "";
    const allowedSet =
      code === "category_id" ? allowedIds :
      code === "category_uid" ? allowedUids :
      null;

    if (!allowedSet) return agg;

    const filtered = (agg.options ?? []).filter(
      (opt) => allowedSet.has(String(opt.value ?? "")),
    );
    return { ...agg, options: filtered, count: filtered.length };
  });
}

// ── Main Fetch ─────────────────────────────────────────────

export async function getProductsByCategory(
  variables: ProductsByCategoryVariables,
): Promise<ProductsByCategoryResponse["products"]> {
  const {
    sort: sortParam,
    filterFacets = {},
    categoryId,
    pageSize,
    currentPage,
    childCategoryIds,
    childCategoryUids,
  } = variables;

  const sortKey = sortParam ?? "position";

  const serverFacets = Object.fromEntries(
    Object.entries(filterFacets).filter(
      ([code]) => !CLIENT_SIDE_FACET_CODES.has(code),
    ),
  );

  const data = await magentoGraphqlFetch<ProductsByCategoryResponse>(
    PRODUCTS_BY_CATEGORY_QUERY,
    {
      filter: buildProductFilterInput(categoryId, serverFacets),
      pageSize,
      currentPage,
      sort: buildProductSortInput(sortKey),
    },
    { revalidate: DEFAULT_REVALIDATE_SECONDS },
  );

  let items = [...data.products.items];

  const productTypeFilter = filterFacets.product_type;
  if (productTypeFilter?.length) {
    const allowed = new Set(productTypeFilter);
    items = items.filter((p) => allowed.has(p.__typename));
  }

  if (sortKey === "product_type") {
    items.sort((a, b) => a.__typename.localeCompare(b.__typename));
  }

  let aggregations: ProductAggregation[] = [
    ...(data.products.aggregations ?? []),
    buildProductTypeAggregation(data.products.items),
  ];

  const hasChildren =
    (childCategoryIds?.length ?? 0) > 0 ||
    (childCategoryUids?.length ?? 0) > 0;

  if (hasChildren) {
    aggregations = filterCategoryAggregations(
      aggregations,
      new Set((childCategoryIds ?? []).map(String)),
      new Set(childCategoryUids ?? []),
    );
  }

  return { ...data.products, items, aggregations };
}
