import {
  magentoGraphqlFetch,
  MagentoGraphqlError,
} from "@/src/framework/graphql/magentoGraphqlFetch";
import { COMMON_PRODUCT_FRAGMENT } from "@/src/framework/graphql/fragments/commonProduct";
import { CONFIGURABLE_PRODUCT_FRAGMENT } from "@/src/framework/graphql/fragments/configurableProduct";
import { BUNDLE_PRODUCT_FRAGMENT } from "@/src/framework/graphql/fragments/bundleProduct";
import { DOWNLOADABLE_PRODUCT_FRAGMENT } from "@/src/framework/graphql/fragments/downloadableProduct";
import { GROUPED_PRODUCT_FRAGMENT } from "@/src/framework/graphql/fragments/groupedProduct";
import { RELATED_PRODUCTS_FRAGMENT } from "@/src/framework/graphql/fragments/relatedProducts";
import type { ProductStockStatus } from "@/src/framework/graphql/queries/products";

// ── Shared Price Type ──────────────────────────────────────

export type ProductPrice = {
  readonly value: number | null;
  readonly currency: string | null;
};

export type ProductDiscount = {
  readonly percent_off: number | null;
  readonly amount_off: number | null;
};

// ── Media ──────────────────────────────────────────────────

export type MediaGalleryItem = {
  readonly url: string;
  readonly label: string | null;
  readonly position: number | null;
};

// ── Categories ─────────────────────────────────────────────

export type ProductCategory = {
  readonly id: number;
  readonly name: string;
  readonly url_path: string | null;
};

// ── Configurable ───────────────────────────────────────────

export type ConfigurableOptionValue = {
  readonly value_index: number;
  readonly label: string;
};

export type ConfigurableOption = {
  readonly attribute_code: string;
  readonly label: string;
  readonly values: readonly ConfigurableOptionValue[];
};

export type ConfigurableVariantAttribute = {
  readonly code: string;
  readonly value_index: number;
};

export type ConfigurableVariantProduct = {
  readonly id: number;
  readonly sku: string;
  readonly name: string;
  readonly stock_status: ProductStockStatus;
  readonly price_range?: {
    readonly minimum_price?: {
      readonly final_price?: ProductPrice | null;
    } | null;
  } | null;
};

export type ConfigurableVariant = {
  readonly attributes: readonly ConfigurableVariantAttribute[];
  readonly product: ConfigurableVariantProduct;
};

// ── Bundle ─────────────────────────────────────────────────

export type BundleOptionProduct = {
  readonly sku: string;
  readonly name: string;
  readonly stock_status: ProductStockStatus;
  readonly price_range?: {
    readonly minimum_price?: {
      readonly final_price?: ProductPrice | null;
    } | null;
  } | null;
};

export type BundleOptionChoice = {
  readonly id: number;
  readonly label: string;
  readonly quantity: number;
  readonly product: BundleOptionProduct;
};

export type BundleItem = {
  readonly option_id: number;
  readonly title: string;
  readonly required: boolean;
  readonly type: string;
  readonly options: readonly BundleOptionChoice[];
};

// ── Downloadable ───────────────────────────────────────────

export type DownloadableLink = {
  readonly id: number;
  readonly title: string;
  readonly price: number;
  readonly sample_url: string | null;
};

export type DownloadableSample = {
  readonly title: string;
  readonly sample_url: string | null;
};

// ── Grouped ────────────────────────────────────────────────

export type GroupedProductItem = {
  readonly position: number;
  readonly qty: number;
  readonly product: {
    readonly id: number;
    readonly sku: string;
    readonly name: string;
    readonly stock_status: ProductStockStatus;
    readonly price_range?: {
      readonly minimum_price?: {
        readonly final_price?: ProductPrice | null;
      } | null;
    } | null;
  };
};

// ── Related Products ───────────────────────────────────────

export type RelatedProduct = {
  readonly __typename?: string;
  readonly id: number;
  readonly uid?: string;
  readonly sku: string;
  readonly name: string;
  readonly url_key: string;
  readonly stock_status: ProductStockStatus;
  readonly small_image?: {
    readonly url?: string | null;
    readonly label?: string | null;
  } | null;
  readonly short_description?: { readonly html?: string | null } | null;
  readonly price_range?: {
    readonly minimum_price?: {
      readonly final_price?: ProductPrice | null;
    } | null;
  } | null;
};

// ── Main Product Detail ────────────────────────────────────

export type ProductDetail = {
  readonly __typename: string;
  readonly id: number;
  readonly uid: string;
  readonly name: string;
  readonly sku: string;
  readonly url_key: string;
  readonly stock_status: ProductStockStatus;
  readonly only_x_left_in_stock: number | null;

  readonly meta_title: string | null;
  readonly meta_description: string | null;

  readonly description?: { readonly html?: string | null } | null;
  readonly short_description?: { readonly html?: string | null } | null;

  readonly image?: { readonly url?: string | null; readonly label?: string | null } | null;
  readonly media_gallery?: readonly MediaGalleryItem[] | null;

  readonly price_range?: {
    readonly minimum_price?: {
      readonly regular_price?: ProductPrice | null;
      readonly final_price?: ProductPrice | null;
      readonly discount?: ProductDiscount | null;
    } | null;
  } | null;

  readonly categories?: readonly ProductCategory[] | null;

  readonly review_count: number | null;
  readonly rating_summary: number | null;

  // Type-specific fields (only populated for matching product type)
  readonly configurable_options?: readonly ConfigurableOption[] | null;
  readonly variants?: readonly ConfigurableVariant[] | null;
  readonly items?: readonly (BundleItem | GroupedProductItem)[] | null;
  readonly downloadable_product_links?: readonly DownloadableLink[] | null;
  readonly downloadable_product_samples?: readonly DownloadableSample[] | null;

  readonly related_products?: readonly RelatedProduct[] | null;
  readonly upsell_products?: readonly RelatedProduct[] | null;
  readonly crosssell_products?: readonly RelatedProduct[] | null;
};

type ProductDetailResponse = {
  products: {
    items: readonly ProductDetail[];
  };
};

// ── Query (composed from fragments) ────────────────────────

const PRODUCT_DETAIL_QUERY = `
  query ProductDetail($urlKey: String!) {
    products(filter: { url_key: { eq: $urlKey } }, pageSize: 1) {
      items {
        ...CommonProductFields
        ...ConfigurableProductFields
        ...BundleProductFields
        ...DownloadableProductFields
        ...GroupedProductFields
        ...RelatedProductsFields
      }
    }
  }
  ${COMMON_PRODUCT_FRAGMENT}
  ${CONFIGURABLE_PRODUCT_FRAGMENT}
  ${BUNDLE_PRODUCT_FRAGMENT}
  ${DOWNLOADABLE_PRODUCT_FRAGMENT}
  ${GROUPED_PRODUCT_FRAGMENT}
  ${RELATED_PRODUCTS_FRAGMENT}
`;

// ── Fetch ──────────────────────────────────────────────────

async function fetchProductDetailOrNullOnFatal(
  urlKey: string,
  storeViewCode?: string,
): Promise<ProductDetail | null | undefined> {
  try {
    const data = await magentoGraphqlFetch<ProductDetailResponse>(
      PRODUCT_DETAIL_QUERY,
      { urlKey },
      storeViewCode ? { storeViewCode } : {},
    );
    return data.products.items[0] ?? null;
  } catch (err) {
    if (err instanceof MagentoGraphqlError && err.isPhpFatal) return undefined;
    throw err;
  }
}

export async function getProductByUrlKey(
  urlKey: string,
  options: { storeViewCode?: string; fallbackStoreViewCode?: string } = {},
): Promise<ProductDetail | null> {
  const storeViewCode = options.storeViewCode?.trim();
  const fallbackStoreViewCode = options.fallbackStoreViewCode?.trim();

  const primary = await fetchProductDetailOrNullOnFatal(urlKey, storeViewCode);
  if (primary) return primary;

  if (
    fallbackStoreViewCode &&
    (!storeViewCode || fallbackStoreViewCode !== storeViewCode)
  ) {
    const fallback = await fetchProductDetailOrNullOnFatal(urlKey, fallbackStoreViewCode);
    if (fallback) return fallback;
  }

  return null;
}
