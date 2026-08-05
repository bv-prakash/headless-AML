/**
 * Magento encodes product-option choices as base64 UIDs in the form
 * `<type>/<id1>/<id2>/.../<idN>` (e.g. `bundle/12/45/1`, `downloadable/8/3`).
 * These UIDs are required by the unified mutations like
 * `addProductsToCart` and `addProductsToRequisitionList` in `selected_options`.
 *
 * Centralised here so Bundle / Downloadable / future product types can share
 * one implementation and not silently drift on encoding rules.
 */

/** Browser-safe base64. SSR fallback uses `Buffer` to avoid `btoa` ReferenceError. */
function base64(input: string): string {
  if (typeof btoa === "function") return btoa(input);
  return Buffer.from(input, "utf8").toString("base64");
}

/**
 * Encode a Magento option UID. Pass the prefix (`"bundle"`, `"downloadable"`,
 * etc.) and the positional id parts in order.
 *
 * @example
 *   encodeOptionUid("bundle", optionId, selectionId, qty);
 *   encodeOptionUid("downloadable", productId, linkId);
 */
export function encodeOptionUid(
  prefix: string,
  ...parts: ReadonlyArray<string | number>
): string {
  return base64([prefix, ...parts].join("/"));
}
