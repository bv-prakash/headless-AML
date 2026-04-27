import { cache } from "react";
import {
  MagentoGraphqlError,
  magentoGraphqlFetch,
} from "@/src/framework/graphql/magentoGraphqlFetch";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";

const STORE_CONFIG_QUERY = `
  query StoreConfig {
    storeConfig {
      copyright
      product_url_suffix
      category_url_suffix
      title_separator
      list_mode
      grid_per_page_values
      list_per_page_values
      grid_per_page
      list_per_page
      catalog_default_sort_by
      root_category_uid
      header_logo_src
      logo_alt
      logo_width
      logo_height
    }
  }
`;

export type StoreConfig = {
  readonly copyright: string | null;
  readonly product_url_suffix: string | null;
  readonly category_url_suffix: string | null;
  readonly title_separator: string | null;
  readonly list_mode: string | null;
  readonly grid_per_page_values: string | null;
  readonly list_per_page_values: string | null;
  readonly grid_per_page: number | null;
  readonly list_per_page: number | null;
  readonly catalog_default_sort_by: string | null;
  readonly root_category_uid: string | null;
  readonly header_logo_src: string | null;
  readonly logo_alt: string | null;
  readonly logo_width: number | null;
  readonly logo_height: number | null;
};

type StoreConfigResponse = {
  storeConfig: StoreConfig;
};

/**
 * Safe defaults used when Magento is temporarily unavailable (e.g. PHP OOM in
 * `StoreRepository`). Keeps header / footer / PLP rendering with sensible values
 * instead of surfacing a full error page.
 */
const FALLBACK_STORE_CONFIG: StoreConfig = {
  copyright: null,
  product_url_suffix: null,
  category_url_suffix: null,
  title_separator: " | ",
  list_mode: null,
  grid_per_page_values: null,
  list_per_page_values: null,
  grid_per_page: 12,
  list_per_page: 12,
  catalog_default_sort_by: "position",
  root_category_uid: null,
  header_logo_src: null,
  logo_alt: null,
  logo_width: null,
  logo_height: null,
};

/**
 * One Magento `storeConfig` fetch per request for the active store (or per explicit store code).
 * Merges fields needed for PLP, footer, nav root category, and header logo so those features share a single round-trip.
 * Falls back to {@link FALLBACK_STORE_CONFIG} when Magento returns a PHP fatal so the page still renders.
 */
export const getStoreConfig = cache(
  async (explicitStoreViewCode?: string): Promise<StoreConfig> => {
    const code =
      explicitStoreViewCode?.trim() || (await getServerStoreViewCode());
    try {
      const data = await magentoGraphqlFetch<StoreConfigResponse>(
        STORE_CONFIG_QUERY,
        {},
        {
          storeViewCode: code,
          /** `storeConfig` rarely changes — 5 min / store view keeps Magento out of the hot path. */
          cacheTtlMs: 5 * 60 * 1000,
          serveStaleOnError: true,
        },
      );
      return data.storeConfig ?? FALLBACK_STORE_CONFIG;
    } catch (err) {
      if (err instanceof MagentoGraphqlError && err.isPhpFatal) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[storeConfig] Magento PHP fatal for store "${code}" — rendering with defaults.`,
          );
        }
        return FALLBACK_STORE_CONFIG;
      }
      throw err;
    }
  },
);
