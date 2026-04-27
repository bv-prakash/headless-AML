import { formatPrice } from "@/src/utils/format";
import type { ProductDetail } from "@/src/framework/graphql/queries/productDetail";
import { decodeHtmlEntities } from "@/src/utils/decodeHtmlEntities";
import { hasVisibleContent } from "@/src/utils/html";
import { sanitizeMagentoCmsHtml } from "@/src/utils/pagebuilder/sanitizeMagentoCmsHtml";

type ProductInfoProps = {
  readonly product: ProductDetail;
};

export default function ProductInfo({ product }: ProductInfoProps) {
  const isOutOfStock = product.stock_status === "OUT_OF_STOCK";
  const minPrice = product.price_range?.minimum_price;
  const regularPrice = minPrice?.regular_price;
  const finalPrice = minPrice?.final_price;
  const discount = minPrice?.discount;
  const hasDiscount =
    discount &&
    (discount.amount_off ?? 0) > 0 &&
    finalPrice?.value != null &&
    regularPrice?.value != null &&
    finalPrice.value < regularPrice.value;

  const descriptionHtml = product.description?.html ?? null;

  return (
    <div className="product-info">
      {/* Product name */}
      <h1 className="font-bold mb-5">
        {product.name}
      </h1>

      {/* Reviews summary */}
      {product.review_count != null && product.review_count > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => {
              const fillPercent = Math.min(
                100,
                Math.max(0, ((product.rating_summary ?? 0) / 20) - i) * 100,
              );
              return (
                <span key={i} className="relative text-lg leading-none">
                  <span className="text-gray-300">&#9733;</span>
                  <span
                    className="absolute inset-0 overflow-hidden text-yellow-400"
                    style={{ width: `${fillPercent}%` }}
                  >
                    &#9733;
                  </span>
                </span>
              );
            })}
          </div>
          <span className="text-sm text-gray-500">
            ({product.review_count} {product.review_count === 1 ? "review" : "reviews"})
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 divide-x divide-aaa">
        <p className="text-black pr-3 leading-1">
          <strong>SKU:</strong><span className="font-normal ml-1">{product.sku}</span>
        </p>

        {/* Stock status */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center capitalize ${
              isOutOfStock
                ? "text-light-red"
                : " text-light-green"
            }`}
          >
            {isOutOfStock ? "Out of Stock" : "In Stock"}
          </span>
          {!isOutOfStock &&
            product.only_x_left_in_stock != null &&
            product.only_x_left_in_stock > 0 && (
              <span className="text-sm font-semibold text-orange-600">
                Only {product.only_x_left_in_stock} left!
              </span>
            )}
        </div>
      </div>
      {/* SKU */}

      {/* Price */}
      {(finalPrice?.value != null || regularPrice?.value != null) && (
        <div className="product-price flex items-baseline gap-3 mt-5">
          <span className="text-xl leading-[1.1] md:text-[26px] lg-custom:text-[32px]! font-bold text-black">
            {formatPrice(
              finalPrice?.value ?? regularPrice?.value,
              finalPrice?.currency ?? regularPrice?.currency,
            )}
          </span>

          {hasDiscount && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(regularPrice.value, regularPrice.currency)}
              </span>
              {discount.percent_off != null && discount.percent_off > 0 && (
                <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  -{Math.round(discount.percent_off)}%
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Short description */}
      {descriptionHtml && hasVisibleContent(descriptionHtml) && (
        <div
          className="border-t product-description-content border-aaa pt-5 my-5 lg-custom:my-7.5! lg-custom:pt-7.5!"
          dangerouslySetInnerHTML={{
            __html: sanitizeMagentoCmsHtml(decodeHtmlEntities(descriptionHtml)),
          }}
        />
      )}
    </div>
  );
}
