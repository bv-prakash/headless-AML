/**
 * Helpers for navigating Magento's inconsistent storefront ID encoding.
 *
 * Some resolvers ship IDs as raw strings (e.g. `"Magento_Sales::view_orders"`
 * for ACL resource codes, or `"3133"` for a `company_structure` row id),
 * while others run the same logical id through
 * `Magento\Framework\GraphQl\Query\Uid::encode`, producing base64
 * (`"TWFnZW50b19TYWxlczo6dmlld19vcmRlcnM="`, `"MzEzMw=="`).
 *
 * To round-trip IDs across endpoints that disagree on encoding, generate
 * every plausible variant of a value and compare in normalised form.
 */

export function tryBase64Encode(value: string): string | null {
  if (!value) return null;
  try {
    return typeof btoa === "function"
      ? btoa(value)
      : Buffer.from(value, "utf-8").toString("base64");
  } catch {
    return null;
  }
}

export function tryBase64Decode(value: string): string | null {
  if (!value) return null;
  try {
    const decoded =
      typeof atob === "function"
        ? atob(value)
        : Buffer.from(value, "base64").toString("utf-8");
    /** Only accept decodings that look like an id token — protects
     *  against false matches on non-base64 strings that happen to be
     *  valid base64 input. */
    return /^[A-Za-z0-9_\-:./]+$/.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/** All forms (raw + b64-decoded + b64-encoded) of `id`, de-duplicated. */
export function idVariants(id: string): ReadonlyArray<string> {
  if (!id) return [];
  const out = new Set<string>([id]);
  const decoded = tryBase64Decode(id);
  if (decoded) out.add(decoded);
  const encoded = tryBase64Encode(id);
  if (encoded) out.add(encoded);
  return Array.from(out);
}

/**
 * Normalise an id to the base64 UID form that Magento's `ID`-typed
 * mutation arguments (e.g. `target_id`, `updateCompanyUser.input.id`)
 * expect. Raw integer strings get encoded; already-base64 values pass
 * through unchanged.
 */
export function toMagentoUid(
  value: string | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  if (/^\d+$/.test(value)) return tryBase64Encode(value) ?? value;
  return value;
}
