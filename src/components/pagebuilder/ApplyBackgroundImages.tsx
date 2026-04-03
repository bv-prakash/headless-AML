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

    let timeout: number | null = null;

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

    const scheduleApply = () => {
      if (timeout != null) return;
      timeout = window.setTimeout(() => {
        timeout = null;
        apply();
      }, 100);
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
      if (timeout != null) window.clearTimeout(timeout);
    };
  }, [rootId, mobileMaxWidthPx]);

  return null;
}

