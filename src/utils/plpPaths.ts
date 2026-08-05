/**
 * Next PLP lives under `/products/...`. Magento `category_url_path` may already include
 * the `products/` prefix — avoid `/products/products/...`.
 */
export function plpHrefFromMagentoCategoryUrlPath(
  urlPath: string | null | undefined,
): string {
  const p = (urlPath ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!p) return "/products";
  if (p === "products" || p.startsWith("products/")) {
    return `/${p}`;
  }
  return `/products/${p}`;
}
