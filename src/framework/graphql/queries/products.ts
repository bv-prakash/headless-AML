import { magentoGraphqlFetch } from "@/src/framework/graphql/magentoGraphqlFetch";

export type ProductListSortKey = "position" | "name";

const SORT_MAP: Record<ProductListSortKey, Record<string, string>> = {
  position: { position: "ASC" },
  name: { name: "ASC" },
};

export function parseProductListSortParam(
  raw: string | string[] | undefined,
): ProductListSortKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "name" ? "name" : "position";
}

function buildProductSortInput(
  sortKey: ProductListSortKey,
): Record<string, string> {
  return SORT_MAP[sortKey];
}

export const FACET_PARAM_PREFIX = "f_";

export function parseFacetSearchParams(
  sp: Record<string, string | string[] | undefined>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};

  for (const [key, val] of Object.entries(sp)) {
    if (!key.startsWith(FACET_PARAM_PREFIX)) continue;
    const code = key.slice(FACET_PARAM_PREFIX.length);
    if (!code) continue;

    const raw = Array.isArray(val) ? val.join(",") : (val ?? "");
    const values = [...new Set(
      raw.split(/[,+]/).map((s) => s.trim()).filter(Boolean),
    )];

    if (values.length) out[code] = values;
  }

  return out;
}

function buildProductFilterInput(
  categoryId: string,
  facets: Record<string, string[]>,
): Record<string, { eq?: string; in?: string[] }> {
  const hasCategoryUid =
    facets.category_uid && facets.category_uid.length > 0;

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
        name
        sku
        url_key
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
      page_info {
        current_page
        total_pages
      }
    }
  }
`;

type ProductsByCategoryVariables = {
  readonly categoryId: string;
  readonly pageSize: number;
  readonly currentPage: number;
  readonly sort?: ProductListSortKey;
  readonly filterFacets?: Record<string, string[]>;
};

type ProductListItem = {
  readonly name: string;
  readonly sku: string;
  readonly url_key: string;
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

type ProductsByCategoryResponse = {
  products: {
    aggregations?: readonly ProductAggregation[] | null;
    items: readonly ProductListItem[];
    page_info: { current_page: number; total_pages: number };
  };
};

const DEFAULT_PRODUCT_REVALIDATE_SECONDS = 60;

export async function getProductsByCategory(
  variables: ProductsByCategoryVariables,
): Promise<ProductsByCategoryResponse["products"]> {
  const {
    sort: sortParam,
    filterFacets = {},
    categoryId,
    pageSize,
    currentPage,
  } = variables;

  const sortKey = sortParam ?? "position";
  const filter = buildProductFilterInput(categoryId, filterFacets);

  const data = await magentoGraphqlFetch<ProductsByCategoryResponse>(
    PRODUCTS_BY_CATEGORY_QUERY,
    { filter, pageSize, currentPage, sort: buildProductSortInput(sortKey) },
    { revalidate: DEFAULT_PRODUCT_REVALIDATE_SECONDS },
  );

  return data.products;
}
