import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getProductByUrlKey,
  type ProductDetail,
  type BundleItem,
  type GroupedProductItem,
} from "@/src/framework/graphql/queries/productDetail";
import { stripHtml } from "@/src/utils/html";
import PageLoader from "@/src/components/common/PageLoader";
import Breadcrumbs from "@/src/components/common/Breadcrumbs";
import ProductGallery from "@/src/components/pdp/ProductGallery";
import ProductInfo from "@/src/components/pdp/ProductInfo";
import ProductDescription from "@/src/components/pdp/ProductDescription";
import ProductCarousel from "@/src/components/pdp/ProductCarousel";
import ProductActions from "@/src/components/plp/ProductActions";
import ConfigurableOptions from "@/src/components/pdp/ConfigurableOptions";
import BundleOptions from "@/src/components/pdp/BundleOptions";
import GroupedProductTable from "@/src/components/pdp/GroupedProductTable";
import DownloadableLinks from "@/src/components/pdp/DownloadableLinks";

type PDPPageProps = {
  params: Promise<{ url_key: string }>;
};

export async function generateMetadata({
  params,
}: PDPPageProps): Promise<Metadata> {
  const { url_key } = await params;
  const product = await getProductByUrlKey(url_key);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const description = product.meta_description
    ?? (product.short_description?.html
      ? stripHtml(product.short_description.html).slice(0, 160)
      : undefined);

  return {
    title: product.meta_title ?? product.name,
    description,
  };
}

function isConfigurable(product: ProductDetail) {
  return product.__typename === "ConfigurableProduct";
}

function isBundle(product: ProductDetail) {
  return product.__typename === "BundleProduct";
}

function isGrouped(product: ProductDetail) {
  return product.__typename === "GroupedProduct";
}

function isDownloadable(product: ProductDetail) {
  return product.__typename === "DownloadableProduct";
}

export default async function PDPPage({ params }: PDPPageProps) {
  const { url_key } = await params;
  const product = await getProductByUrlKey(url_key);

  if (!product) notFound();

  const category = product.categories?.[0] ?? null;
  const categoryId = category ? String(category.id) : null;
  const hasTypeSpecificActions =
    isConfigurable(product) || isBundle(product) || isGrouped(product) || isDownloadable(product);
  const showSimpleActions = !hasTypeSpecificActions;

  return (
    <Suspense
      fallback={
        <PageLoader label="Loading product…" minHeightClassName="min-h-[50vh]" />
      }
    >
      {/* Breadcrumbs */}
      {categoryId && (
        <div className="container mt-5 mb-5 lg-custom:mb-12.5!">
          <Breadcrumbs categoryId={categoryId} productName={product.name} />
        </div>
      )}

      {/* Product main section */}
      <div className="container relative mb-8 lg-custom:mb-12!">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg-custom:gap-12!">
          {/* Left: Gallery */}
          <div>
            <ProductGallery
              images={product.media_gallery ?? []}
              productName={product.name}
              mainImageUrl={product.image?.url}
              mainImageLabel={product.image?.label}
            />
          </div>

          {/* Right: Info + Type-specific options + Actions */}
          <div className="flex flex-col gap-6">
            <ProductInfo product={product} />

            {/* Configurable product options */}
            {isConfigurable(product) &&
              product.configurable_options &&
              product.variants && (
                <ConfigurableOptions
                  parentSku={product.sku}
                  productId={product.id}
                  productName={product.name}
                  options={product.configurable_options}
                  variants={product.variants}
                />
              )}

            {/* Bundle product options */}
            {isBundle(product) && product.items && (
              <BundleOptions
                sku={product.sku}
                productId={product.id}
                productName={product.name}
                items={product.items as BundleItem[]}
              />
            )}

            {/* Grouped product table */}
            {isGrouped(product) && product.items && (
              <GroupedProductTable
                sku={product.sku}
                productId={product.id}
                productName={product.name}
                items={product.items as GroupedProductItem[]}
              />
            )}

            {/* Downloadable product links */}
            {isDownloadable(product) && (
              <DownloadableLinks
                sku={product.sku}
                productId={product.id}
                productName={product.name}
                links={product.downloadable_product_links}
                samples={product.downloadable_product_samples}
              />
            )}

            {/* Simple/non-configurable add-to-cart + compare + wishlist */}
            {showSimpleActions && (
              <ProductActions
                sku={product.sku}
                productId={product.id}
                productName={product.name}
                productType={product.__typename}
                stockStatus={product.stock_status}
                showQuantity
              />
            )}
          </div>
        </div>

        {/* Description tabs */}
        <div className="mt-10 md:mt-14">
          <ProductDescription
            descriptionHtml={product.description?.html}
          />
        </div>

        {/* Related Products */}
        {product.related_products && product.related_products.length > 0 && (
          <ProductCarousel title="Related Products" products={product.related_products} />
        )}

        {/* Upsell Products */}
        {product.upsell_products && product.upsell_products.length > 0 && (
          <ProductCarousel title="ACCESSORIES" products={product.upsell_products} />
        )}

        {/* Cross-sell Products */}
        {product.crosssell_products && product.crosssell_products.length > 0 && (
          <ProductCarousel title="Frequently Bought Together" products={product.crosssell_products} />
        )}
      </div>
    </Suspense>
  );
}
