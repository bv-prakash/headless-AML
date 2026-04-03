import { magentoGraphqlFetch } from "@/src/framework/graphql/magentoGraphqlFetch";

const DEFAULT_REVALIDATE_SECONDS = 300;

export type StoreConfig = {
  readonly store_code: string;
  readonly store_name: string;
  readonly is_default_store: boolean;
  readonly store_group_code: string;
  readonly is_default_store_group: boolean;
  readonly locale: string;
  readonly base_currency_code: string;
  readonly default_display_currency_code: string;
  readonly timezone: string;
  readonly weight_unit: string;
  readonly base_url: string;
  readonly base_link_url: string;
  readonly base_static_url: string;
  readonly base_media_url: string;
  readonly secure_base_url: string;
  readonly secure_base_link_url: string;
  readonly secure_base_static_url: string;
  readonly secure_base_media_url: string;
};

type StoreConfigQueryResponse = {
  storeConfig?: StoreConfig | null;
};

const STORE_CONFIG_QUERY = `
  query StoreConfig {
    storeConfig {
      store_code
      store_name
      is_default_store
      store_group_code
      is_default_store_group
      locale
      base_currency_code
      default_display_currency_code
      timezone
      weight_unit
      base_url
      base_link_url
      base_static_url
      base_media_url
      secure_base_url
      secure_base_link_url
      secure_base_static_url
      secure_base_media_url
    }
  }
`;

export async function getStoreConfig(): Promise<StoreConfig | null> {
  const data = await magentoGraphqlFetch<StoreConfigQueryResponse>(
    STORE_CONFIG_QUERY,
    undefined,
    { revalidate: DEFAULT_REVALIDATE_SECONDS },
  );

  return data.storeConfig ?? null;
}
