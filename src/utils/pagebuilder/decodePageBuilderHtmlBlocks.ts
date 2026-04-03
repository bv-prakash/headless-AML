import { decodeHtmlEntities } from "@/src/utils/decodeHtmlEntities";

/**
 * PageBuilder sometimes escapes HTML inside blocks like:
 *   <div data-content-type="html"> &lt;p&gt;...&lt;/p&gt; </div>
 *
 * We decode ONLY the inner content of those blocks, leaving attributes intact
 * (important for things like `data-background-images` JSON).
 */
export function decodePageBuilderHtmlBlocks(html: string): string {
  if (!html.includes('data-content-type="html"')) return html;

  return html.replace(
    /(<div\b[^>]*\bdata-content-type="html"[^>]*>)([\s\S]*?)(<\/div>)/gi,
    (_match, openTag: string, inner: string, closeTag: string) => {
      if (!inner.includes("&lt;") && !inner.includes("&gt;")) {
        return `${openTag}${inner}${closeTag}`;
      }
      return `${openTag}${decodeHtmlEntities(inner)}${closeTag}`;
    },
  );
}

