import {
  magentoGraphqlFetch,
  MagentoGraphqlError,
} from "@/src/framework/graphql/magentoGraphqlFetch";
import { COMMON_PRODUCT_FRAGMENT } from "../fragments/commonProduct";
import { CONFIGURABLE_PRODUCT_FRAGMENT } from "../fragments/configurableProduct";
import { BUNDLE_PRODUCT_FRAGMENT } from "../fragments/bundleProduct";
import { DOWNLOADABLE_PRODUCT_FRAGMENT } from "../fragments/downloadableProduct";
import { GROUPED_PRODUCT_FRAGMENT } from "../fragments/groupedProduct";
import { RELATED_PRODUCTS_FRAGMENT } from "../fragments/relatedProducts";
import type { ProductDetail } from "../types";

type ProductDetailResponse = {
  products: {
    items: readonly ProductDetail[];
  };
};

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
