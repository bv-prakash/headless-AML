"use client";

import { useEffect } from "react";

const INIT_ATTR = "data-pb-video-inited";
const IFRAME_ATTR = "data-pb-video-iframe";

/** Magento / PageBuilder often HTML-escapes JSON in attributes. */
function parseJsonAttr(raw: string | null): Record<string, unknown> | null {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    try {
      const unescaped = raw
        .replace(/&quot;/gi, '"')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\");
      return JSON.parse(unescaped) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function extractVimeoId(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  const player = /player\.vimeo\.com\/video\/(\d+)/i.exec(t);
  if (player) return player[1];
  const short = /vimeo\.com\/(?:channels\/[^/]+\/|groups\/[^/]+\/videos\/|)(\d+)/i.exec(t);
  if (short) return short[1];
  return null;
}

function extractYouTubeId(url: string): string | null {
  try {
    const t = url.trim();
    const u = new URL(t, "https://www.youtube.com");
    if (u.hostname === "youtu.be" || u.hostname.endsWith(".youtu.be")) {
      const id = u.pathname.replace(/^\//, "");
      return id || null;
    }
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

function readVideoUrl(wrapper: HTMLElement): string | null {
  const direct =
    wrapper.getAttribute("data-video-src")?.trim()
    || wrapper.getAttribute("data-video-url")?.trim();
  if (direct) return direct;

  const bg = parseJsonAttr(wrapper.getAttribute("data-background-images"));
  if (bg) {
    for (const key of ["video_url", "video_src", "videoUrl", "desktop_image"] as const) {
      const v = bg[key];
      if (typeof v === "string" && v.trim()) {
        const s = v.trim();
        if (/vimeo|youtu\.?be|youtube\.com/i.test(s)) return s;
      }
    }
  }

  const link = wrapper.querySelector<HTMLAnchorElement>("a[href*='vimeo.com'], a[href*='youtube.com'], a[href*='youtu.be']");
  return link?.href?.trim() || null;
}

function readFallbackUrl(wrapper: HTMLElement): string | null {
  const u = wrapper.getAttribute("data-video-fallback-src")?.trim();
  if (u) return u;
  const bg = parseJsonAttr(wrapper.getAttribute("data-background-images"));
  if (!bg) return null;
  const desk = bg.desktop_image;
  if (typeof desk === "string" && desk.trim() && !/vimeo|youtube/i.test(desk)) return desk.trim();
  return null;
}

function toBool(raw: string | null | undefined): boolean {
  if (raw == null) return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1";
}

function buildVimeoSrc(id: string, loop: boolean): string {
  const q = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
    muted: "1",
    background: "1",
    dnt: "1",
  });
  if (loop) q.set("loop", "1");
  return `https://player.vimeo.com/video/${id}?${q.toString()}`;
}

function buildYouTubeSrc(id: string, loop: boolean): string {
  const q = new URLSearchParams({
    autoplay: "0",
    mute: "1",
    controls: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });
  if (loop) q.set("loop", "1");
  q.set("playlist", id);
  return `https://www.youtube.com/embed/${id}?${q.toString()}`;
}

function ensureRelativeStacking(wrapper: HTMLElement): void {
  const pos = window.getComputedStyle(wrapper).position;
  if (pos === "static") wrapper.style.position = "relative";
  const z = Number.parseInt(window.getComputedStyle(wrapper).zIndex, 10);
  if (!Number.isFinite(z) || z === 0) wrapper.style.zIndex = "0";
}

function applyFallbackBackground(wrapper: HTMLElement, url: string): void {
  if (!url) return;
  const next = `url("${url}")`;
  if (wrapper.style.backgroundImage !== next) {
    wrapper.style.backgroundImage = next;
  }
  if (!wrapper.style.backgroundSize) wrapper.style.backgroundSize = "cover";
  if (!wrapper.style.backgroundPosition) wrapper.style.backgroundPosition = "center";
  if (!wrapper.style.backgroundRepeat) wrapper.style.backgroundRepeat = "no-repeat";
}

function initWrapper(wrapper: HTMLElement): void {
  if (wrapper.getAttribute(INIT_ATTR) === "1") return;

  const bgType = wrapper.getAttribute("data-background-type")?.toLowerCase() ?? "";
  const videoUrl = readVideoUrl(wrapper);
  const isVideoType = bgType === "video";
  const hasRemoteVideo =
    Boolean(videoUrl) && (/vimeo|youtu\.?be|youtube\.com/i.test(videoUrl!));

  if (!isVideoType && !hasRemoteVideo) return;

  const vimeoId = videoUrl ? extractVimeoId(videoUrl) : null;
  const ytId = !vimeoId && videoUrl ? extractYouTubeId(videoUrl) : null;
  const fallback = readFallbackUrl(wrapper);

  if (!vimeoId && !ytId) {
    if (fallback) applyFallbackBackground(wrapper, fallback);
    return;
  }

  const loop = toBool(wrapper.getAttribute("data-video-loop"));
  const lazy = toBool(wrapper.getAttribute("data-video-lazy-load"));
  const playVisible = toBool(wrapper.getAttribute("data-video-play-only-visible"));

  ensureRelativeStacking(wrapper);

  if (fallback) applyFallbackBackground(wrapper, fallback);

  const embedSrc = vimeoId
    ? buildVimeoSrc(vimeoId, loop)
    : buildYouTubeSrc(ytId!, loop);

  const iframe = document.createElement("iframe");
  iframe.className = "pagebuilder-headless-video-bg";
  iframe.setAttribute(IFRAME_ATTR, "1");
  iframe.setAttribute("title", "Background video");
  iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  const s = iframe.style;
  s.position = "absolute";
  s.inset = "0";
  s.width = "100%";
  s.height = "100%";
  s.border = "0";
  s.pointerEvents = "none";
  s.zIndex = "0";
  s.objectFit = "cover";

  if (lazy || playVisible) {
    iframe.dataset.embedSrc = embedSrc;
    iframe.removeAttribute("src");
  } else {
    iframe.src = embedSrc;
  }

  wrapper.insertBefore(iframe, wrapper.firstChild);
  wrapper.setAttribute(INIT_ATTR, "1");

  const overlay = wrapper.querySelector(".pagebuilder-overlay, [data-element='overlay']");
  if (overlay instanceof HTMLElement) {
    const oz = window.getComputedStyle(overlay).zIndex;
    if (oz === "auto" || !Number.parseInt(oz, 10)) overlay.style.zIndex = "1";
  }

  if (!lazy && !playVisible) return;

  const attachSrc = () => {
    const u = iframe.dataset.embedSrc;
    if (u && !iframe.getAttribute("src")) iframe.src = u;
  };

  const detachSrc = () => {
    iframe.removeAttribute("src");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e) return;
      if (e.isIntersecting && e.intersectionRatio > 0.08) attachSrc();
      else if (playVisible && !e.isIntersecting) detachSrc();
    },
    { threshold: [0, 0.08, 0.25, 0.5] },
  );
  observer.observe(wrapper);

  if (!lazy && playVisible) attachSrc();
}

function scan(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".pagebuilder-slide-wrapper").forEach(initWrapper);
}

const THROTTLE_MS = 200;

export default function ApplyPageBuilderVideos({
  rootId = "html-body",
}: {
  rootId?: string;
}) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    let throttleTimer: number | null = null;
    let observer: MutationObserver | null = null;

    const run = () => {
      scan(root);
    };

    const runThrottled = () => {
      if (throttleTimer != null) return;
      throttleTimer = window.setTimeout(() => {
        throttleTimer = null;
        if (observer) observer.disconnect();
        try {
          run();
        } finally {
          observer?.observe(root, { childList: true, subtree: true });
        }
      }, THROTTLE_MS);
    };

    /** After Swiper replaces markup (~same frame as PageBuilderSliders timeout 0). */
    const boot = window.setTimeout(run, 320);
    observer = new MutationObserver(runThrottled);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(boot);
      if (throttleTimer != null) window.clearTimeout(throttleTimer);
      observer?.disconnect();
      root.querySelectorAll<HTMLElement>(`[${INIT_ATTR}="1"]`).forEach((el) => {
        el.querySelectorAll(`iframe[${IFRAME_ATTR}]`).forEach((f) => f.remove());
        el.removeAttribute(INIT_ATTR);
      });
    };
  }, [rootId]);

  return null;
}
