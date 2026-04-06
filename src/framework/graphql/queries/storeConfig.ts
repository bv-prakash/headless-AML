import { magentoGraphqlFetch } from "@/src/framework/graphql/magentoGraphqlFetch";

const STORE_CONFIG_QUERY = `
  query StoreConfig {
    storeConfig {
      product_url_suffix
      category_url_suffix
      title_separator
      list_mode
      grid_per_page_values
      list_per_page_values
      grid_per_page
      list_per_page
      catalog_default_sort_by
    }
  }
`;

export type StoreConfig = {
  readonly product_url_suffix: string | null;
  readonly category_url_suffix: string | null;
  readonly title_separator: string | null;
  readonly list_mode: string | null;
  readonly grid_per_page_values: string | null;
  readonly list_per_page_values: string | null;
  readonly grid_per_page: number | null;
  readonly list_per_page: number | null;
  readonly catalog_default_sort_by: string | null;
};

type StoreConfigResponse = {
  storeConfig: StoreConfig;
};

const REVALIDATE_SECONDS = 300;

export async function getStoreConfig(): Promise<StoreConfig> {
  const data = await magentoGraphqlFetch<StoreConfigResponse>(
    STORE_CONFIG_QUERY,
    {},
    { revalidate: REVALIDATE_SECONDS },
  );

  return data.storeConfig;
}

