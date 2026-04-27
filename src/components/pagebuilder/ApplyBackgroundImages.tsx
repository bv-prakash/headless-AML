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

/** Min time between mutation-driven full scans (Swiper/PageBuilder can mutate DOM every frame). */
const MUTATION_APPLY_THROTTLE_MS = 150;
/** Debounce window resize so matchMedia + full scan does not run continuously while dragging. */
const RESIZE_DEBOUNCE_MS = 120;

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

    /** Browser timers are numeric ids; avoid `NodeJS.Timeout` vs `number` mismatch under @types/node. */
    let mutationThrottleTimer: number | null = null;
    let resizeDebounceTimer: number | null = null;
    let lastMutationApply = 0;
    let observer: MutationObserver | null = null;

    const apply = () => {
      const isMobile = window.matchMedia(`(max-width: ${mobileMaxWidthPx}px)`).matches;
      const nodes = root.querySelectorAll<HTMLElement>("[data-background-images]");

      nodes.forEach((node) => {
        const parsed = parseBackgroundImages(node.getAttribute("data-background-images"));
        const url = (isMobile ? parsed?.mobile_image : parsed?.desktop_image) || parsed?.desktop_image;
        if (!url) return;

        const nextBg = `url("${url}")`;
        if (node.style.backgroundImage !== nextBg) {
          node.style.backgroundImage = nextBg;
        }
        if (!node.style.backgroundSize) node.style.backgroundSize = "cover";
        if (!node.style.backgroundPosition) node.style.backgroundPosition = "center";
        if (!node.style.backgroundRepeat) node.style.backgroundRepeat = "no-repeat";
      });
    };

    const runMutationThrottled = () => {
      const now = performance.now();
      const elapsed = now - lastMutationApply;
      if (elapsed >= MUTATION_APPLY_THROTTLE_MS) {
        lastMutationApply = now;
        if (mutationThrottleTimer) {
          clearTimeout(mutationThrottleTimer);
          mutationThrottleTimer = null;
        }
        if (observer) observer.disconnect();
        try {
          apply();
        } finally {
          observer?.observe(root, { childList: true, subtree: true });
        }
        return;
      }
      if (mutationThrottleTimer != null) return;
      mutationThrottleTimer = window.setTimeout(() => {
        mutationThrottleTimer = null;
        lastMutationApply = performance.now();
        if (observer) observer.disconnect();
        try {
          apply();
        } finally {
          observer?.observe(root, { childList: true, subtree: true });
        }
      }, MUTATION_APPLY_THROTTLE_MS - elapsed);
    };

    const onResizeDebounced = () => {
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = window.setTimeout(() => {
        resizeDebounceTimer = null;
        apply();
      }, RESIZE_DEBOUNCE_MS);
    };

    apply();

    observer = new MutationObserver(() => {
      runMutationThrottled();
    });
    observer.observe(root, { childList: true, subtree: true });

    window.addEventListener("resize", onResizeDebounced, { passive: true });

    return () => {
      observer?.disconnect();
      observer = null;
      window.removeEventListener("resize", onResizeDebounced);
      if (mutationThrottleTimer) clearTimeout(mutationThrottleTimer);
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
    };
  }, [rootId, mobileMaxWidthPx]);

  return null;
}
