import { decodeHtmlEntities } from "./decodeHtmlEntities";

export function stripHtml(html: string): string {
  const decoded = decodeHtmlEntities(html);
  return decoded.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Returns true when `html` contains visible text content.
 * If the markup has a `data-element="main"` wrapper (PageBuilder),
 * only the inner content of that element is inspected.
 */
export function hasVisibleContent(html: string | null | undefined): boolean {
  if (!html) return false;

  const decoded = decodeHtmlEntities(html);

  const mainMatch = decoded.match(
    /data-element=["']main["'][^>]*>([\s\S]*?)<\/\s*div\s*>/i,
  );
  const fragment = mainMatch ? mainMatch[1] : decoded;

  const text = fragment.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text.length > 0;
}
