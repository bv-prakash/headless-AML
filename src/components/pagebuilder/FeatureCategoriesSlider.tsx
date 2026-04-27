"use client";

import { useEffect } from "react";
import Swiper from "swiper";

import "swiper/css";

type FeatureCategoriesSliderOptions = {
  rootId?: string;
  containerSelector?: string;
  listSelector?: string;
  itemSelector?: string;
  minItemsToEnable?: number;
};

type InitializedSlider = {
  container: HTMLElement;
  originalHtml: string;
  instance: Swiper;
};

/**
 * Upgrades CMS lists to Swiper using class selectors from PageBuilder HTML.
 * This is DOM-based because the markup is server-rendered via CMS/PageBuilder.
 */
export default function FeatureCategoriesSlider(
  options?: FeatureCategoriesSliderOptions,
) {
  const rootId = options?.rootId ?? "html-body";
  const containerSelector = options?.containerSelector ?? ".home-feature-categories";
  const listSelector = options?.listSelector ?? ".feature-categories-ul";
  const itemSelector = options?.itemSelector ?? ".feature-categories-column";
  const minItemsToEnable = options?.minItemsToEnable ?? 2;

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const initialized: InitializedSlider[] = [];
    let cancelled = false;

    const scheduleId = window.setTimeout(() => {
      if (cancelled) return;

      const containers = Array.from(
        root.querySelectorAll<HTMLElement>(containerSelector),
      );
      containers.forEach((containerRoot) => {
        if (cancelled) return;
        if (containerRoot.dataset.featureCategoriesSwiperInitialized === "true") return;

        const list = containerRoot.querySelector<HTMLElement>(`:scope ${listSelector}`);
        if (!list) return;

        const itemNodes = Array.from(
          list.querySelectorAll<HTMLElement>(`:scope > ${itemSelector}`),
        );
        if (itemNodes.length < minItemsToEnable) return;

        const originalHtml = list.outerHTML;
        const container = document.createElement("div");
        container.className = "swiper feature-categories-swiper";

        const wrapper = document.createElement("div");
        wrapper.className = "swiper-wrapper";

        itemNodes.forEach((item) => {
          const slide = document.createElement("div");
          slide.className = `swiper-slide ${item.className}`.trim();
          slide.innerHTML = item.innerHTML;
          wrapper.appendChild(slide);
        });

        container.appendChild(wrapper);
        list.replaceWith(container);

        const instance = new Swiper(container, {
          watchOverflow: true,
          slidesPerView: 1.5,
          spaceBetween: 16,
          breakpoints: {
            640: {
              slidesPerView: 2.5,
              spaceBetween: 16,
            },
            768: {
              slidesPerView: 4,
              spaceBetween: 16,
            },
          },
        });

        initialized.push({ container, originalHtml, instance });
        containerRoot.dataset.featureCategoriesSwiperInitialized = "true";
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(scheduleId);
      initialized.forEach(({ container, originalHtml, instance }) => {
        try {
          instance.destroy(true, true);
        } catch {
          /* already destroyed */
        }
        const parent = container.parentElement?.closest<HTMLElement>(containerSelector);
        if (parent) {
          delete parent.dataset.featureCategoriesSwiperInitialized;
        }
        container.outerHTML = originalHtml;
      });
    };
  }, [containerSelector, itemSelector, listSelector, minItemsToEnable, rootId]);

  return null;
}
