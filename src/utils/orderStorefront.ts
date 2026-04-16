/**
 * Magento GraphQL order `id` is often a base64 `Order:<entity_id>` global id.
 * Storefront URLs (print, RMA, etc.) use the numeric entity id in `order_id/…`.
 */
export function storefrontOrderEntityId(graphqlOrderId: string): string {
  const trimmed = graphqlOrderId.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  try {
    const decoded = globalThis.atob(trimmed);
    const m = /^Order:(\d+)$/.exec(decoded);
    if (m) return m[1];
  } catch {
    /* not base64 */
  }
  return trimmed;
}
