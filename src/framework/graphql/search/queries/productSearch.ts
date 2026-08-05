import { gql } from "@apollo/client";

export const SEARCH_RESULTS_PAGE_SIZE = 4;

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
