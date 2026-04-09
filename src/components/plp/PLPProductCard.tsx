import Link from "next/link";
import Image from "next/image";
import { formatProductTypeLabel } from "@/src/framework/graphql/constants/productTypes";
import ProductActions from "./ProductActions";

export type PLPProductCardProps = {
  readonly id: string | number;
  readonly productId: number;
  readonly href: string;
  readonly imageUrl: string;
  readonly name: string;
  readonly description?: string;
  readonly productType?: string;
  readonly stockStatus: string;
  readonly imageSize?: number;
  readonly labelImageUrl?: string;
  readonly zIndex?: number;
};

const PLPProductCard = ({
  id,
  productId,
  href,
  imageUrl,
  name,
  description,
  productType,
  stockStatus,
  imageSize = 280,
  labelImageUrl,
  zIndex,
}: PLPProductCardProps) => {
  const typeLabel = productType ? formatProductTypeLabel(productType) : "";
  const isOutOfStock = stockStatus === "OUT_OF_STOCK";

  return (
    <div
      className="product-item-info flex h-full flex-col"
      id={`product-item-info_${id}`}
      data-container="product-grid"
      style={typeof zIndex === "number" ? { zIndex } : undefined}
    >
      <Link
        href={href}
        className={`product-item-photo block text-center mb-3 md:mb-4.5 group relative${isOutOfStock ? " opacity-60" : ""}`}
      >
        <span
          className={`product-image-container product-image-container-${id}`}
          style={{ width: imageSize, position: "relative" }}
        >
          <span
            className={`absolute top-2 right-2 z-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              isOutOfStock
                ? "bg-red-600 text-white"
                : "text-light-green"
            }`}
          >
            {isOutOfStock ? "Out of Stock" : "In Stock"}
          </span>

          <span
            className="product-image-wrapper block h-0 overflow-hidden relative z-1 pb-full"
            style={{ paddingBottom: "100%" }}
          >
            <Image
              className="product-image-photo block inset-0 m-auto absolute w-auto group-hover:scale-[1.08] transition-transform duration-200 ease-in-out"
              src={imageUrl}
              loading="lazy"
              width={imageSize}
              height={imageSize}
              alt={name}
            />
          </span>

          {labelImageUrl && (
            <span
              className={`amlabel-position-top-left-${id}-prod amlabel-position-wrapper`}
              style={{
                lineHeight: "normal",
                position: "absolute",
                display: "block",
                width: "auto",
                height: "auto",
                top: 0,
                left: 0,
              }}
            >
              <span
                className={`amasty-label-container amasty-label-for-${id}`}
                style={{
                  display: "block",
                  width: 67,
                  height: 32,
                  position: "absolute",
                  left: 10,
                  color: "rgb(255, 255, 255)",
                }}
              >
                <span className="amlabel-text" />
                <Image
                  className="amasty-label-image"
                  src={labelImageUrl}
                  alt="New"
                  title="New"
                  width={67}
                  height={32}
                  loading="lazy"
                  style={{
                    opacity: 1,
                    verticalAlign: "top",
                    width: "100%",
                    height: "auto",
                  }}
                />
              </span>
            </span>
          )}
        </span>
      </Link>

      <div className="product-item-details px-[5px] text-center flex flex-col flex-1">
        <strong className="product-item-name font-bold block m-0 mb-2.5">
          <Link
            className="product-item-link line-clamp-2 min-h-[35px] lg-custom:min-h-[45px]! hover:text-theme-primary transition-colors duration-200"
            href={href}
          >
            {name}
          </Link>
        </strong>

        {typeLabel && (
          <span className="product-type-label block mb-2.5">
            Type: {typeLabel}
          </span>
        )}

        {description && (
          <div className="product-description line-clamp-3 m-0 mb-2.5 font-light">
            {description}
          </div>
        )}

        <ProductActions
          sku={String(id)}
          productId={productId}
          productName={name}
          productType={productType}
          stockStatus={stockStatus}
          productPageHref={href}
          overrideStyles="flex-1 items-end"
        />
      </div>
    </div>
  );
};

export default PLPProductCard;
