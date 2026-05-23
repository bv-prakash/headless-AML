"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import PLPProductCard from "@/src/components/plp/PLPProductCard";
import { stripHtml } from "@/src/utils/html";
import type { RelatedProduct } from "@/src/framework/graphql/pdp/types";

type ProductCarouselProps = {
  readonly title: string;
  readonly products: readonly RelatedProduct[];
};

const BREAKPOINTS = {
  0: { slidesPerView: 2, spaceBetween: 10 },
  640: { slidesPerView: 3, spaceBetween: 16 },
  1024: { slidesPerView: 4, spaceBetween: 16 },
  1200: { slidesPerView: 5, spaceBetween: 16 },
};

function getVisibleCount(width: number): number {
  if (width >= 1200) return 5;
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

export default function ProductCarousel({ title, products }: ProductCarouselProps) {
  const filtered = products.filter((p) => p.small_image?.url);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (filtered.length === 0) return null;

  const useSlider = filtered.length > visibleCount;

  const renderCard = (product: RelatedProduct) => (
    <PLPProductCard
      id={product.sku}
      productId={product.id}
      href={`/${product.url_key}`}
      imageUrl={product.small_image?.url ?? ""}
      name={product.name}
      description={
        product.short_description?.html
          ? stripHtml(product.short_description.html)
          : undefined
      }
      productType={product.__typename}
      stockStatus={product.stock_status}
      imageSize={280}
    />
  );

  return (
    <section className="mb-0 mt-10 lg:mt-15 lg-custom:mb-[75px]!">
      <h2 className="font-semibold mb-5 lg:mb-7.5">{title}</h2>

      {useSlider ? (
        <div className="product-carousel-slider">
          <Swiper
            modules={[Navigation]}
            navigation
            slidesPerView={2}
            spaceBetween={10}
            breakpoints={BREAKPOINTS}
          >
            {filtered.map((product) => (
              <SwiperSlide key={product.id}>
                {renderCard(product)}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl-custom:grid-cols-5! gap-4">
          {filtered.map((product) => (
            <div key={product.id}>
              {renderCard(product)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
