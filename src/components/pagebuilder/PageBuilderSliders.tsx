"use client";

import { useEffect } from "react";
import Swiper from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export type PageBuilderSliderOptions = {
  rootId?: string;
  selector?: string;
  /**
   * Limit how many `.pagebuilder-slider` instances to upgrade on the page.
   * - number: fixed limit
   * - responsive: array of media queries; the last matching query wins
   */
  limit?: number;
  responsiveLimit?: Array<{ mediaQuery: string; limit: number }>;
  loop?: boolean;
  autoplay?: boolean;
  autoplayDelayMs?: number;
  pagination?: boolean;
  navigation?: boolean;
};

const toBool = (value: string | null | undefined): boolean | undefined => {
  if (value == null) return undefined;
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
};

const toInt = (value: string | null | undefined): number | undefined => {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
};

const resolveLimit = (
  baseLimit: number | undefined,
  responsiveLimit: Array<{ mediaQuery: string; limit: number }> | undefined,
): number => {
  let limit = baseLimit ?? Number.POSITIVE_INFINITY;
  if (!responsiveLimit?.length) return limit;

  responsiveLimit.forEach(({ mediaQuery, limit: l }) => {
    if (window.matchMedia(mediaQuery).matches) {
      limit = l;
    }
  });

  return limit;
};

/**
 * Upgrades Magento PageBuilder `.pagebuilder-slider` markup into Swiper.
 * It preserves each slide's inner HTML and relies on other helpers (like ApplyBackgroundImages)
 * to set `background-image` from `data-background-images`.
 */
export default function PageBuilderSliders(options?: PageBuilderSliderOptions) {
  const rootId = options?.rootId ?? "html-body";
  const selector = options?.selector ?? ".pagebuilder-slider";
  const autoplay = options?.autoplay;
  const autoplayDelayMs = options?.autoplayDelayMs;
  const loop = options?.loop;
  const pagination = options?.pagination;
  const navigation = options?.navigation;
  const limit = options?.limit;
  const responsiveLimitKey = JSON.stringify(options?.responsiveLimit ?? []);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const sliders = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const responsiveLimit =
      (JSON.parse(responsiveLimitKey) as Array<{ mediaQuery: string; limit: number }>) ||
      [];
    const resolvedLimit = resolveLimit(limit, responsiveLimit);
    const targetSliders =
      Number.isFinite(resolvedLimit) && resolvedLimit >= 0
        ? sliders.slice(0, resolvedLimit)
        : sliders;

    targetSliders.forEach((slider) => {
      // Prevent double-init
      if (slider.dataset.swiperInitialized === "true") return;

      const autoplayAttr = toBool(slider.getAttribute("data-autoplay"));
      const autoplaySpeedAttr = toInt(slider.getAttribute("data-autoplay-speed"));
      const loopAttr = toBool(slider.getAttribute("data-infinite-loop"));
      const dotsAttr = toBool(slider.getAttribute("data-show-dots"));
      const arrowsAttr = toBool(slider.getAttribute("data-show-arrows"));

      const autoplayEnabled = autoplay ?? autoplayAttr ?? true;
      const autoplayDelay =
        autoplayDelayMs ?? autoplaySpeedAttr ?? 7000;
      const loopEnabled = loop ?? loopAttr ?? true;
      const paginationEnabled = pagination ?? dotsAttr ?? true;
      const navigationEnabled = navigation ?? arrowsAttr ?? false;

      // Find PageBuilder slides
      const slideNodes = Array.from(
        slider.querySelectorAll<HTMLElement>('[data-content-type="slide"]'),
      );
      if (!slideNodes.length) return;

      // Build Swiper DOM
      const container = document.createElement("div");
      container.className = "swiper";

      const wrapper = document.createElement("div");
      wrapper.className = "swiper-wrapper";

      slideNodes.forEach((node) => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = node.innerHTML;
        wrapper.appendChild(slide);
      });

      container.appendChild(wrapper);

      let paginationEl: HTMLDivElement | null = null;
      if (paginationEnabled) {
        paginationEl = document.createElement("div");
        paginationEl.className = "swiper-pagination";
        container.appendChild(paginationEl);
      }

      let nextEl: HTMLDivElement | null = null;
      let prevEl: HTMLDivElement | null = null;
      if (navigationEnabled) {
        nextEl = document.createElement("div");
        prevEl = document.createElement("div");
        nextEl.className = "swiper-button-next";
        prevEl.className = "swiper-button-prev";
        container.appendChild(prevEl);
        container.appendChild(nextEl);
      }

      // Replace PageBuilder slider content with Swiper container
      slider.innerHTML = "";
      slider.appendChild(container);

      // Init Swiper
      // eslint-disable-next-line no-new
      new Swiper(container, {
        modules: [Autoplay, Navigation, Pagination],
        loop: loopEnabled,
        autoplay: autoplayEnabled
          ? { delay: autoplayDelay, disableOnInteraction: false }
          : false,
        // Swiper modules expect params objects to exist when modules are enabled.
        // Provide explicit `enabled` flags to avoid runtime `...reading 'enabled'` errors.
        pagination: paginationEnabled && paginationEl
          ? { enabled: true, el: paginationEl, clickable: true }
          : { enabled: false },
        navigation: navigationEnabled && nextEl && prevEl
          ? { enabled: true, nextEl, prevEl }
          : { enabled: false },
      });

      slider.dataset.swiperInitialized = "true";
    });
  }, [
    autoplay,
    autoplayDelayMs,
    limit,
    responsiveLimitKey,
    loop,
    navigation,
    pagination,
    rootId,
    selector,
  ]);

  return null;
}

