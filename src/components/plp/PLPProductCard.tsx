import Link from "next/link";
import Image from "next/image";

export type PLPProductCardProps = {
  id: string | number;
  href: string;
  imageUrl: string;
  name: string;
  description?: string;
  imageSize?: number;
  labelImageUrl?: string;
  zIndex?: number;
};

const PLPProductCard = ({
  id,
  href,
  imageUrl,
  name,
  description,
  imageSize = 280,
  labelImageUrl,
  zIndex,
}: PLPProductCardProps) => {
  const containerClass = `product-image-container-${id}`;

    return (
      <div
        className="product-item-info"
        id={`product-item-info_${id}`}
        data-container="product-grid"
        style={typeof zIndex === "number" ? { zIndex } : undefined}
      >
        <Link href={href} className="product-item-photo block text-center mb-3 md:mb-4.5 group">
          <span
            className={`product-image-container ${containerClass}`}
            style={{
              width: imageSize,
              position: labelImageUrl ? "relative" : undefined,
            }}
          >
            <span className="product-image-wrapper block h-0 overflow-hidden relative z-1 pb-full" style={{ paddingBottom: "100%" }}>
              <Image
                className="product-image-photo block inset-0 m-auto absolute w-auto group-hover:scale-[1.08] transition-transform duration-200  ease-in-out"
                src={imageUrl}
                loading="lazy"
                width={imageSize}
                height={imageSize}
                alt={name}
              />
            </span>

            {labelImageUrl ? (
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
                    style={{ opacity: 1, verticalAlign: "top", width: "100%", height: "auto" }}
                  />
                </span>
              </span>
            ) : null}
          </span>
        </Link>

        <div className="product-item-details px-[5px] text-center">
          <strong className="product-item-name font-bold block m-0 mb-2.5">
            <Link className="product-item-link line-clamp-2 min-h-[35px] lg-custom:min-h-[45px]! hover:text-theme-primary transition-colors duration-200" href={href}>
              {name}
            </Link>
          </strong>

          {description ? (
            <div className="product-description line-clamp-3 m-0 mb-2.5 font-light ">{description}</div>
          ) : null}
        </div>
      </div>
    );
}

export default PLPProductCard;