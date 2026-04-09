export function parsePageParam(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(v ?? "", 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

/** First string value from Next.js `searchParams` entry (edit links, filters). */
export function pickSearchParamString(
  raw: string | string[] | undefined,
): string | undefined {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 0) {
    return raw[0];
  }
  return undefined;
}

/** Positive integer from search param, e.g. `?qty=3` on PDP edit-from-cart. */
export function pickSearchParamPositiveInt(
  raw: string | string[] | undefined,
): number | undefined {
  const s = pickSearchParamString(raw);
  if (s == null) return undefined;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Positive integer from a single query value (`useSearchParams().get("qty")`).
 * Returns `null` if missing or invalid (positive integer only).
 */
export function parsePositiveIntString(
  raw: string | null | undefined,
): number | null {
  if (raw == null || raw === "") return null;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** PDP link from cart/minicart “edit” — preserves variant SKU and line qty in the query string. */
export function buildProductEditHref(
  urlKey: string,
  productSku: string,
  quantity: number,
): string {
  const q = new URLSearchParams();
  q.set("sku", productSku);
  q.set("qty", String(quantity));
  return `/${encodeURIComponent(urlKey)}?${q.toString()}`;
}
