"use client";

import { useEffect } from "react";

type BackgroundImages = {
  desktop_image?: string;
  mobile_image?: string;
};

const parseBackgroundImages = (raw: string | null): BackgroundImages | null => {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as BackgroundImages;
  } catch {
    // Magento PageBuilder often embeds escaped JSON like:
    //   {\"desktop_image\":\"...\",\"mobile_image\":\"...\"}
    // Try a second pass by unescaping quotes/backslashes.
    try {
      const unescaped = raw
        .replace(/&quot;/gi, '"')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\");
      return JSON.parse(unescaped) as BackgroundImages;
    } catch {
      return null;
    }
  }
};

export default function ApplyBackgroundImages({
  rootId = "html-body",
  mobileMaxWidthPx = 768,
}: {
  rootId?: string;
  mobileMaxWidthPx?: number;
}) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    let rafId: number | null = null;

    const apply = () => {
      const isMobile = window.matchMedia(`(max-width: ${mobileMaxWidthPx}px)`).matches;
      const nodes = root.querySelectorAll<HTMLElement>("[data-background-images]");

      nodes.forEach((node) => {
        const parsed = parseBackgroundImages(node.getAttribute("data-background-images"));
        const url = (isMobile ? parsed?.mobile_image : parsed?.desktop_image) || parsed?.desktop_image;
        if (!url) return;

        // Keep in sync across resize (desktop <-> mobile).
        const nextBg = `url("${url}")`;
        if (node.style.backgroundImage !== nextBg) {
          node.style.backgroundImage = nextBg;
        }
        node.style.backgroundSize = node.style.backgroundSize || "cover";
        node.style.backgroundPosition = node.style.backgroundPosition || "center";
        node.style.backgroundRepeat = node.style.backgroundRepeat || "no-repeat";
      });
    };

    /** Coalesce rapid mutations (PageBuilder + Swiper) without the old 100ms gap that left slides visually empty. */
    const scheduleApply = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        apply();
      });
    };

    apply();

    // PageBuilder/Swiper can replace slider markup after our first render.
    // Re-apply background images when DOM changes.
    const observer = new MutationObserver(() => scheduleApply());
    observer.observe(root, { childList: true, subtree: true });

    window.addEventListener("resize", apply);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
      if (rafId != null) window.cancelAnimationFrame(rafId);
    };
  }, [rootId, mobileMaxWidthPx]);

  return null;
}

