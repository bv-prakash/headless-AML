import { gql } from "@apollo/client";
import { magentoGraphqlFetch } from "@/src/framework/graphql/magentoGraphqlFetch";

const SEARCH_RESULTS_PAGE_SIZE = 4;

export const PRODUCT_SEARCH_QUERY = gql`
  query ProductSearch($search: String!, $pageSize: Int!) {
    products(search: $search, pageSize: $pageSize) {
      total_count
      items {
        uid
        sku
        name
        url_key
        small_image {
          url
        }
        short_description {
          html
        }
      }
    }
  }
`;

export { SEARCH_RESULTS_PAGE_SIZE };

export type SearchProductItem = {
  readonly uid: string;
  readonly sku: string;
  readonly name: string;
  readonly url_key: string;
  readonly small_image?: { readonly url?: string | null } | null;
  readonly short_description?: { readonly html?: string | null } | null;
};

export type ProductSearchVariables = {
  readonly search: string;
  readonly pageSize: number;
};

export type ProductSearchResponse = {
  products: {
    total_count: number;
    items: readonly SearchProductItem[];
  };
};

// ── Server-side full search (used by search results page) ───

type ServerSearchProductItem = SearchProductItem & {
  readonly id: number;
  readonly __typename: string;
  readonly stock_status: "IN_STOCK" | "OUT_OF_STOCK";
};

type SearchAggregationOption = {
  readonly label?: string | null;
  readonly value?: string | null;
  readonly count?: number | null;
};

export type SearchAggregation = {
  readonly attribute_code?: string | null;
  readonly count?: number | null;
  readonly label?: string | null;
  readonly options?: readonly SearchAggregationOption[] | null;
};

type ServerSearchResponse = {
  products: {
    total_count: number;
    items: readonly ServerSearchProductItem[];
    aggregations?: readonly SearchAggregation[] | null;
  };
};

const SERVER_SEARCH_QUERY = `
  query ProductSearchPage(
    $search: String!
    $pageSize: Int!
    $currentPage: Int!
    $filter: ProductAttributeFilterInput
    $sort: ProductAttributeSortInput
  ) {
    products(
      search: $search
      pageSize: $pageSize
      currentPage: $currentPage
      filter: $filter
      sort: $sort
    ) {
      total_count
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
        sku
        name
        url_key
        stock_status
        small_image {
          url
        }
        short_description {
          html
        }
      }
    }
  }
`;

export type SearchProductsOptions = {
  searchTerm: string;
  pageSize: number;
  currentPage: number;
  filter?: Record<string, { eq?: string; in?: string[] }>;
  sort?: Record<string, string>;
};

export async function searchProducts(
  options: SearchProductsOptions,
): Promise<{
  items: readonly ServerSearchProductItem[];
  totalCount: number;
  aggregations: readonly SearchAggregation[];
}> {
  const { searchTerm, pageSize, currentPage, filter, sort } = options;

  const variables: Record<string, unknown> = {
    search: searchTerm,
    pageSize,
    currentPage,
  };
  if (filter && Object.keys(filter).length > 0) {
    variables.filter = filter;
  }
  if (sort && Object.keys(sort).length > 0) {
    variables.sort = sort;
  }

  const data = await magentoGraphqlFetch<ServerSearchResponse>(
    SERVER_SEARCH_QUERY,
    variables,
  );

  return {
    items: data.products.items,
    totalCount: data.products.total_count,
    aggregations: data.products.aggregations ?? [],
  };
}
