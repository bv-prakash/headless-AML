import type {
  ConfigurableOption,
  ConfigurableVariant,
} from "@/src/framework/graphql/pdp/types";

function normalizeAttrKey(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normSku(s: string | null | undefined): string {
  return (s ?? "").trim();
}

function sameIndex(a: number | string | undefined, b: number | string | undefined): boolean {
  return Number(a) === Number(b);
}

export function findConfigurableVariantBySku(
  variants: readonly ConfigurableVariant[],
  sku: string | null | undefined,
): ConfigurableVariant | undefined {
  const t = normSku(sku);
  if (!t || variants.length === 0) return undefined;
  return variants.find(
    (x) =>
      normSku(x.product.sku) === t ||
      normSku(x.product.sku).toLowerCase() === t.toLowerCase(),
  );
}

/**
 * Maps variant `attributes` to `configurable_options` keys (`attribute_code`).
 * Magento often aligns codes, but casing / formatting can differ between the two shapes.
 */
export function buildOptionSelectionsFromVariant(
  v: ConfigurableVariant,
  options: readonly ConfigurableOption[],
): Record<string, number> {
  const next: Record<string, number> = {};
  const attrs = v.attributes;

  for (const opt of options) {
    const ac = opt.attribute_code;
    let hit =
      attrs.find((a) => a.code === ac) ??
      attrs.find((a) => a.code.toLowerCase() === ac.toLowerCase()) ??
      attrs.find((a) => normalizeAttrKey(a.code) === normalizeAttrKey(ac));
    if (hit) {
      next[ac] = Number(hit.value_index);
    }
  }

  for (const opt of options) {
    if (next[opt.attribute_code] != null) continue;
    for (const val of opt.values) {
      const hasIndex = attrs.some((a) => sameIndex(a.value_index, val.value_index));
      if (hasIndex) {
        next[opt.attribute_code] = Number(val.value_index);
        break;
      }
    }
  }

  return next;
}

/** Map cart line labels to PDP `attribute_code` + `value_index` (works when SKU on cart line is parent). */
export function buildSelectionsFromConfigurableLabels(
  cartOptions: readonly { option_label: string; value_label: string }[],
  options: readonly ConfigurableOption[],
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const co of cartOptions) {
    const opt = options.find(
      (o) => o.label.trim().toLowerCase() === co.option_label.trim().toLowerCase(),
    );
    if (!opt) continue;
    const val = opt.values.find(
      (v) => v.label.trim().toLowerCase() === co.value_label.trim().toLowerCase(),
    );
    if (val != null) {
      next[opt.attribute_code] = Number(val.value_index);
    }
  }
  return next;
}

export function getInitialConfigurableSelections(
  initialVariantSku: string | null | undefined,
  variants: readonly ConfigurableVariant[],
  options: readonly ConfigurableOption[],
): Record<string, number> {
  const v = findConfigurableVariantBySku(variants, initialVariantSku);
  if (!v) return {};
  return buildOptionSelectionsFromVariant(v, options);
}

/** Single source for PDP UI: RTK row → swatch map (prefer explicit selections, then cart labels, then variant SKU). */
export function deriveSelectionsFromConfigurableStoreRow(
  row:
    | {
        readonly variantSku: string;
        readonly optionLabels: readonly { option_label: string; value_label: string }[];
        readonly optionSelections: Record<string, number> | null;
      }
    | undefined,
  variants: readonly ConfigurableVariant[],
  options: readonly ConfigurableOption[],
): Record<string, number> {
  if (!row) return {};
  if (row.optionSelections && Object.keys(row.optionSelections).length > 0) {
    return row.optionSelections;
  }
  const fromLabels = buildSelectionsFromConfigurableLabels(row.optionLabels, options);
  if (Object.keys(fromLabels).length > 0) return fromLabels;
  const v = findConfigurableVariantBySku(variants, row.variantSku);
  if (v) return buildOptionSelectionsFromVariant(v, options);
  return {};
}

function attributeCodesMatch(a: string, b: string): boolean {
  return (
    a === b ||
    a.toLowerCase() === b.toLowerCase() ||
    normalizeAttrKey(a) === normalizeAttrKey(b)
  );
}

/** Resolve selected swatches to the cart variant (selections keyed by `attribute_code`). */
export function findMatchingVariant(
  variants: readonly ConfigurableVariant[],
  options: readonly ConfigurableOption[],
  selections: Record<string, number>,
): ConfigurableVariant | null {
  if (!options.length) return null;
  if (!options.every((opt) => selections[opt.attribute_code] != null)) {
    return null;
  }

  return (
    variants.find((v) =>
      options.every((opt) => {
        const selectedIdx = selections[opt.attribute_code];
        return v.attributes.some(
          (a) =>
            attributeCodesMatch(a.code, opt.attribute_code) &&
            sameIndex(a.value_index, selectedIdx),
        );
      }),
    ) ?? null
  );
}
