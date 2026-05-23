import type { ProductStockStatus } from "@/src/framework/graphql/plp/queries/getProductsByCategory";

export type ProductPrice = {
  readonly value: number | null;
  readonly currency: string | null;
};

export type ProductDiscount = {
  readonly percent_off: number | null;
  readonly amount_off: number | null;
};

export type MediaGalleryItem = {
  readonly url: string;
  readonly label: string | null;
  readonly position: number | null;
};

export type ProductCategory = {
  readonly id: number;
  readonly name: string;
  readonly url_path: string | null;
};

export type ConfigurableOptionValue = {
  readonly value_index: number;
  readonly label: string;
  /** Base64 UID required by `addProductsToRequisitionList` `selected_options`. */
  readonly uid: string;
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
