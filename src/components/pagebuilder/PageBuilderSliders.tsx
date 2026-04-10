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

/** Original `.pagebuilder-slider` innerHTML before Swiper replaces it — required to re-init after cleanup (Strict Mode, client navigations). */
const sourceHtmlBySlider = new WeakMap<HTMLElement, string>();

function buildSwiperSlideFromPageBuilderNode(node: HTMLElement): HTMLDivElement {
  const slide = document.createElement("div");
  slide.classList.add("swiper-slide");
  for (const attr of Array.from(node.attributes)) {
    const { name, value } = attr;
    if (name.toLowerCase() === "class") {
      slide.classList.add(...node.classList);
      continue;
    }
    slide.setAttribute(name, value);
  }
  slide.innerHTML = node.innerHTML;
  return slide;
}

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

    const swiperInstances: Swiper[] = [];
    const initializedRoots: HTMLElement[] = [];
    let cancelled = false;

    /** Defer so `#html-body` + sibling effects (e.g. backgrounds) settle; avoids broken / empty Swiper. */
    const scheduleId = window.setTimeout(() => {
      if (cancelled) return;

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
        if (cancelled) return;

        if (!sourceHtmlBySlider.has(slider)) {
          sourceHtmlBySlider.set(slider, slider.innerHTML);
        }

        const autoplayAttr = toBool(slider.getAttribute("data-autoplay"));
        const autoplaySpeedAttr = toInt(slider.getAttribute("data-autoplay-speed"));
        const loopAttr = toBool(slider.getAttribute("data-infinite-loop"));
        const dotsAttr = toBool(slider.getAttribute("data-show-dots"));
        const arrowsAttr = toBool(slider.getAttribute("data-show-arrows"));

        const autoplayEnabled = autoplay ?? autoplayAttr ?? true;
        const autoplayDelay =
          autoplayDelayMs ?? autoplaySpeedAttr ?? 7000;
        const paginationEnabled = pagination ?? dotsAttr ?? true;
        const navigationEnabled = navigation ?? arrowsAttr ?? false;

        const slideNodes = Array.from(
          slider.querySelectorAll<HTMLElement>('[data-content-type="slide"]'),
        );
        if (!slideNodes.length) return;

        /** Swiper `loop` breaks or glitches with a single slide — disable loop in that case. */
        const loopFromAttr = loop ?? loopAttr ?? true;
        const loopEnabled = Boolean(loopFromAttr) && slideNodes.length > 1;

        const container = document.createElement("div");
        container.className = "swiper";

        const wrapper = document.createElement("div");
        wrapper.className = "swiper-wrapper";

        slideNodes.forEach((node) => {
          const slide = buildSwiperSlideFromPageBuilderNode(node);
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

        slider.innerHTML = "";
        slider.appendChild(container);

        const instance = new Swiper(container, {
          modules: [Autoplay, Navigation, Pagination],
          loop: loopEnabled,
          watchOverflow: true,
          autoplay: autoplayEnabled
            ? { delay: autoplayDelay, disableOnInteraction: false }
            : false,
          pagination: paginationEnabled && paginationEl
            ? { enabled: true, el: paginationEl, clickable: true }
            : { enabled: false },
          navigation: navigationEnabled && nextEl && prevEl
            ? { enabled: true, nextEl, prevEl }
            : { enabled: false },
        });

        swiperInstances.push(instance);
        slider.dataset.swiperInitialized = "true";
        initializedRoots.push(slider);
    });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(scheduleId);
      swiperInstances.forEach((sw) => {
        try {
          sw.destroy(true, true);
        } catch {
          /* already destroyed */
        }
      });
      for (const slider of initializedRoots) {
        const raw = sourceHtmlBySlider.get(slider);
        if (raw != null) {
          slider.innerHTML = raw;
        }
        delete slider.dataset.swiperInitialized;
      }
    };
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

