"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import Script from "next/script";
import type { MediaGalleryItem } from "@/src/framework/graphql/pdp/types";
import { pdpZoomOptionsString } from "@/src/config/magicZoom";

type ProductGalleryProps = {
  readonly images: readonly MediaGalleryItem[];
  readonly productName: string;
  readonly mainImageUrl?: string | null;
  readonly mainImageLabel?: string | null;
};

declare global {
  interface Window {
    MagicZoomPlus?: {
      start: (id?: string) => void;
      stop: (id?: string) => void;
      refresh: (id?: string) => void;
    };
    MagicZoom?: {
      start: (id?: string) => void;
      stop: (id?: string) => void;
      refresh: (id?: string) => void;
    };
  }
}

const ZOOM_ID = "pdp-gallery";
const CSS_ID = "magiczoomplus-css";
const CSS_HREF = "/third-party/magiczoomplus/magiczoomplus.css";

function getMZ() {
  return window.MagicZoomPlus ?? window.MagicZoom ?? null;
}

export default function ProductGallery({
  images,
  productName,
  mainImageUrl,
  mainImageLabel,
}: ProductGalleryProps) {
  const zoomActive = useRef(false);
  const mountedRef = useRef(true);

  const gallery = useMemo(() => {
    const sorted = [...images]
      .filter((img) => img.url)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    if (sorted.length > 0) return sorted;
    if (mainImageUrl) {
      return [{ url: mainImageUrl, label: mainImageLabel ?? productName, position: 0 }];
    }
    return [];
  }, [images, mainImageUrl, mainImageLabel, productName]);

  const galleryKey = useMemo(
    () => gallery.map((img) => img.url).join("|"),
    [gallery],
  );

  useEffect(() => {
    mountedRef.current = true;

    let link = document.getElementById(CSS_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = CSS_ID;
      link.rel = "stylesheet";
      link.href = CSS_HREF;
      document.head.appendChild(link);
    }

    return () => {
      mountedRef.current = false;
      document.getElementById(CSS_ID)?.remove();
    };
  }, []);

  const stopZoom = useCallback(() => {
    if (!zoomActive.current) return;
    const mz = getMZ();
    if (mz) {
      try { mz.stop(ZOOM_ID); } catch { /* noop */ }
    }
    zoomActive.current = false;
  }, []);

  const startZoom = useCallback(() => {
    if (!mountedRef.current || gallery.length === 0) return;
    const mz = getMZ();
    if (!mz) return;

    try {
      mz.start(ZOOM_ID);
      zoomActive.current = true;
    } catch { /* noop */ }
  }, [gallery.length]);

  const initZoom = useCallback(() => {
    stopZoom();
    startZoom();
  }, [stopZoom, startZoom]);

  useEffect(() => {
    if (!zoomActive.current) return;
    stopZoom();
    startZoom();
  }, [galleryKey, stopZoom, startZoom]);

  useEffect(() => {
    return () => {
      stopZoom();
    };
  }, [stopZoom]);

  if (gallery.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg">
        No image available
      </div>
    );
  }

  const mainImage = gallery[0];

  return (
    <div className="product-gallery">
      <Script
        id="magiczoomplus-js"
        src="/third-party/magiczoomplus/magiczoomplus.js"
        strategy="lazyOnload"
        onReady={initZoom}
        onError={(e) => {
          console.error("MagicZoomPlus failed to load:", e);
        }}
      />

      <a
        id={ZOOM_ID}
        className="MagicZoom"
        href={mainImage.url}
        data-zoom-image={mainImage.url}
        data-options={pdpZoomOptionsString}
      >
        <img
          src={mainImage.url}
          alt={mainImage.label ?? productName}
        />
      </a>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto mt-4 pb-1">
          {gallery.map((img, index) => (
            <a
              key={`${img.url}-${index}`}
              href={img.url}
              data-zoom-id={ZOOM_ID}
              data-image={img.url}
              className="shrink-0 w-16 h-16 md:w-20 md:h-20 border-2 border-gray-200 hover:border-theme-primary rounded-md overflow-hidden cursor-pointer transition-colors"
            >
              <img
                src={img.url}
                alt={img.label ?? `${productName} thumbnail ${index + 1}`}
                className="object-contain w-full h-full p-1"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
