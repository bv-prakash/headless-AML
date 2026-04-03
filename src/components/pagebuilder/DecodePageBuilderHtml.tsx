"use client";

import { useEffect } from "react";
import { decodeHtmlEntities } from "@/src/utils/decodeHtmlEntities";

export default function DecodePageBuilderHtml({
  rootId = "html-body",
}: {
  rootId?: string;
}) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const nodes = root.querySelectorAll<HTMLElement>('[data-content-type="html"]');
    nodes.forEach((node) => {
      const raw = node.innerHTML;
      if (!raw.includes("&lt;") && !raw.includes("&gt;")) return;
      node.innerHTML = decodeHtmlEntities(raw);
    });
  }, [rootId]);

  return null;
}

