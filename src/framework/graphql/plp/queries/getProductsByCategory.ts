import { magentoGraphqlFetch } from "@/src/framework/graphql/magentoGraphqlFetch";
import { formatProductTypeLabel } from "@/src/framework/graphql/constants/productTypes";
import {
  getLanguageCodeForStoreView,
  normalizeStoreViewCode,
} from "@/src/config/storeViews";
import {
  PLP_PRODUCTS_BY_CATEGORY_QUERY,
  toMagentoProductsByCategoryVariables,
  type ProductListSortKey,
} from "../plpCatalogGraphql";

export const FACET_PARAM_PREFIX = "f_";

export type { ProductListSortKey } from "../plpCatalogGraphql";
export { parseProductListSortParam } from "../plpCatalogGraphql";

export function parseFacetSearchParams(
  sp: Record<string, string | string[] | undefined>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};

  for (const [key, val] of Object.entries(sp)) {
    if (!key.startsWith(FACET_PARAM_PREFIX)) continue;
    const code = key.slice(FACET_PARAM_PREFIX.length);
    if (!code) continue;

    const raw = Array.isArray(val) ? val.join(",") : (val ?? "");
    const values = [
      ...new Set(raw.split(/[,+]/).map((s) => s.trim()).filter(Boolean)),
    ];

    if (values.length) out[code] = values;
  }

  return out;
}

export type ProductStockStatus = "IN_STOCK" | "OUT_OF_STOCK";

type ProductListItem = {
  readonly id: number;
  readonly __typename: string;
  readonly name: string;
  readonly sku: string;
  readonly url_key: string;
  readonly stock_status: ProductStockStatus;
  readonly small_image?: { readonly url?: string | null } | null;
  readonly short_description?: { readonly html?: string | null } | null;
  readonly price_range?: {
    readonly minimum_price?: {
      readonly regular_price?: {
        readonly value?: number | null;
        readonly currency?: string | null;
      } | null;
    } | null;
  } | null;
};

type AggregationOption = {
  readonly label?: string | null;
  readonly value?: string | null;
  readonly count?: number | null;
};

export type ProductAggregation = {
  readonly attribute_code?: string | null;
  readonly count?: number | null;
  readonly label?: string | null;
  readonly options?: readonly AggregationOption[] | null;
};

type ProductsByCategoryVariables = {
  readonly categoryId: string;
  /** From `categoryList { uid }`. When present (and no URL `f_category_uid`), used as `filter.category_uid`. */
  readonly categoryUid?: string | null;
  /** Pin `Store` header for this request (from `getServerStoreViewCode()`). */
  readonly storeViewCode?: string;
  /**
   * Preferred store view for aggregation labels/options. When set, its
   * labels win over the main response labels (useful when products
   * fall back to another store).
   */
  readonly aggregationLabelPreferredStoreViewCode?: string;
  readonly aggregationLabelPreferredCategoryId?: string;
  readonly aggregationLabelPreferredCategoryUid?: string | null;
  readonly aggregationLabelFallbackStoreViewCode?: string;
  readonly pageSize: number;
  readonly currentPage: number;
  readonly sort?: ProductListSortKey;
  readonly filterFacets?: Record<string, string[]>;
};

type ProductsByCategoryResponse = {
  products: {
    aggregations?: readonly ProductAggregation[] | null;
    items: readonly ProductListItem[];
    total_count: number;
  };
};

type AttributeMetadataResponse = {
  customAttributeMetadata?: {
    items?: readonly {
      attribute_code?: string | null;
      storefront_labels?: readonly {
        store_code?: string | null;
        label?: string | null;
      }[] | null;
    }[] | null;
  } | null;
};

const ATTRIBUTE_METADATA_QUERY = `
  query AttributeLabels($attributes: [AttributeInput!]!) {
    customAttributeMetadata(attributes: $attributes) {
      items {
        attribute_code
        storefront_labels {
          store_code
          label
        }
      }
    }
  }
`;

function buildProductTypeAggregation(
  items: readonly ProductListItem[],
): ProductAggregation {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.__typename, (counts.get(item.__typename) ?? 0) + 1);
  }

  const options = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([typeName, count]) => ({
      label: formatProductTypeLabel(typeName),
      value: typeName,
      count,
    }));

  return {
    attribute_code: "product_type",
    count: options.length,
    label: "Product Type",
    options,
  };
}

function mergeAggregationLabels(
  primary: readonly ProductAggregation[],
  fallback: readonly ProductAggregation[],
): ProductAggregation[] {
  const fallbackByCode = new Map<string, ProductAggregation>();
  fallback.forEach((agg) => {
    const code = agg.attribute_code?.trim();
    if (code) fallbackByCode.set(code, agg);
  });

  const mergedPrimary = primary.map((agg) => {
    const code = agg.attribute_code?.trim();
    if (!code) return agg;
    const fallbackAgg = fallbackByCode.get(code);
    if (!fallbackAgg) return agg;

    const primaryOptions = agg.options ?? [];
    const fallbackOptionByValue = new Map<string, { label?: string | null }>();
    (fallbackAgg.options ?? []).forEach((opt) => {
      const value = opt.value?.trim();
      if (!value) return;
      fallbackOptionByValue.set(value, { label: opt.label });
    });

    const options =
      primaryOptions.length > 0
        ? primaryOptions.map((opt) => {
            const value = opt.value?.trim();
            if (!value) return opt;
            const fallbackOpt = fallbackOptionByValue.get(value);
            if ((opt.label ?? "").trim() || !fallbackOpt?.label) return opt;
            return { ...opt, label: fallbackOpt.label };
          })
        : (fallbackAgg.options ?? null);

    return {
      ...agg,
      label: (agg.label ?? "").trim() ? agg.label : fallbackAgg.label,
      options,
    };
  });

  const primaryCodes = new Set(
    mergedPrimary
      .map((agg) => agg.attribute_code?.trim())
      .filter((code): code is string => Boolean(code)),
  );
  const fallbackOnly = fallback.filter((agg) => {
    const code = agg.attribute_code?.trim();
    if (!code) return false;
    return !primaryCodes.has(code);
  });

  return [...mergedPrimary, ...fallbackOnly];
}

function hasMissingAggregationLabels(aggregations: readonly ProductAggregation[]): boolean {
  return aggregations.some((agg) => {
    const hasAggregationLabel = Boolean((agg.label ?? "").trim());
    if (!hasAggregationLabel) return true;
    return (agg.options ?? []).some((opt) => !((opt.label ?? "").trim()));
  });
}

async function getAggregationAttributeLabelOverrides(
  aggregations: readonly ProductAggregation[],
  storeViewCode?: string,
): Promise<Map<string, string>> {
  const code = storeViewCode?.trim();
  if (!code) return new Map<string, string>();
  const normalizedCode = normalizeStoreViewCode(code) ?? code;
  const languageCode = getLanguageCodeForStoreView(normalizedCode);

  const attributeCodes = [
    ...new Set(
      aggregations
        .map((agg) => agg.attribute_code?.trim())
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  if (attributeCodes.length === 0) return new Map<string, string>();

  try {
    const attributes = attributeCodes.map((attributeCode) => ({
      attribute_code: attributeCode,
      entity_type: "catalog_product",
    }));

    const data = await magentoGraphqlFetch<AttributeMetadataResponse>(
      ATTRIBUTE_METADATA_QUERY,
      { attributes },
      { storeViewCode: code },
    );

    const out = new Map<string, string>();
    (data.customAttributeMetadata?.items ?? []).forEach((item) => {
      const attrCode = item.attribute_code?.trim();
      if (!attrCode) return;
      const labels = item.storefront_labels ?? [];
      const exactStoreMatch = labels.find((l) => {
        const rawStoreCode = l.store_code?.trim();
        if (!rawStoreCode) return false;
        const normalizedStoreCode = normalizeStoreViewCode(rawStoreCode) ?? rawStoreCode;
        return normalizedStoreCode === normalizedCode;
      });
      const exactLabel = exactStoreMatch?.label?.trim() ?? "";
      if (exactLabel) {
        out.set(attrCode, exactLabel);
        return;
      }

      const languageAwareMatch = labels.find((l) => {
        const sc = l.store_code?.trim().toLowerCase() ?? "";
        if (!sc) return false;
        if (languageCode === "ar") {
          return sc.includes("_ar") || sc.includes("arabic");
        }
        return sc.includes("_en") || sc.includes("english") || sc === "default";
      });
      const languageAwareLabel = languageAwareMatch?.label?.trim() ?? "";
      if (languageAwareLabel) {
        out.set(attrCode, languageAwareLabel);
        return;
      }

      if (labels.length === 1) {
        const singleLabel = labels[0]?.label?.trim() ?? "";
        if (singleLabel) out.set(attrCode, singleLabel);
      }
    });
    return out;
  } catch {
    return new Map<string, string>();
  }
}

export async function getProductsByCategory(
  variables: ProductsByCategoryVariables,
): Promise<ProductsByCategoryResponse["products"]> {
  const {
    sort: sortParam,
    filterFacets = {},
    categoryId,
    categoryUid,
    storeViewCode,
    aggregationLabelPreferredStoreViewCode,
    aggregationLabelPreferredCategoryId,
    aggregationLabelPreferredCategoryUid,
    aggregationLabelFallbackStoreViewCode,
    pageSize,
    currentPage,
  } = variables;

  const sortKey = sortParam ?? "position";

  const hasFacetCategoryUid =
    (filterFacets.category_uid?.length ?? 0) > 0;

  const scopeUid =
    categoryUid?.trim() && !hasFacetCategoryUid ? categoryUid.trim() : null;

  const graphqlVariables = toMagentoProductsByCategoryVariables({
    categoryId,
    filterFacets,
    pageSize,
    currentPage,
    sort: sortKey,
    categoryScopeUid: scopeUid,
  });

  const EMPTY_RESPONSE: ProductsByCategoryResponse = {
    products: { items: [], aggregations: [], total_count: 0 },
  };

  let data: ProductsByCategoryResponse;
  try {
    data = await magentoGraphqlFetch<ProductsByCategoryResponse>(
      PLP_PRODUCTS_BY_CATEGORY_QUERY,
      graphqlVariables,
      storeViewCode?.trim() ? { storeViewCode: storeViewCode.trim() } : {},
    );
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[PLP] products GraphQL failed — rendering empty result.", err);
    }
    data = EMPTY_RESPONSE;
  }
  const preferredCode = aggregationLabelPreferredStoreViewCode?.trim();
  const primaryCode = storeViewCode?.trim();
  const fallbackCode = aggregationLabelFallbackStoreViewCode?.trim();

  let items = [...(data.products.items ?? [])];

  const productTypeFilter = filterFacets.product_type;
  if (productTypeFilter?.length) {
    const allowed = new Set(productTypeFilter);
    items = items.filter((p) => allowed.has(p.__typename));
  }

  if (sortKey === "product_type") {
    items.sort((a, b) => a.__typename.localeCompare(b.__typename));
  }

  /** Magento facets as returned (do not trim category buckets — id/uid mismatches cleared all filters). */
  let aggregations: ProductAggregation[] = [...(data.products.aggregations ?? [])];
  const shouldHydrateMissingLabels = hasMissingAggregationLabels(aggregations);
  if (shouldHydrateMissingLabels) {
    let preferredAggregations: readonly ProductAggregation[] = [];
    if (preferredCode && preferredCode !== primaryCode) {
      try {
        const preferredCategoryScopeUid =
          aggregationLabelPreferredCategoryUid?.trim() || null;
        const preferredLabelVariables = toMagentoProductsByCategoryVariables({
          categoryId: aggregationLabelPreferredCategoryId?.trim() || categoryId,
          categoryScopeUid: preferredCategoryScopeUid,
          filterFacets,
          pageSize,
          currentPage,
          sort: sortKey,
        });
        const preferredData = await magentoGraphqlFetch<ProductsByCategoryResponse>(
          PLP_PRODUCTS_BY_CATEGORY_QUERY,
          preferredLabelVariables,
          { storeViewCode: preferredCode },
        );
        preferredAggregations = preferredData.products.aggregations ?? [];
      } catch {
        preferredAggregations = [];
      }
    }

    let fallbackAggregations: readonly ProductAggregation[] = [];
    if (fallbackCode && fallbackCode !== primaryCode) {
      try {
        const fallbackLabelVariables = toMagentoProductsByCategoryVariables({
          categoryId,
          /** Do not pin primary store `category_uid` here; UID can
           *  differ per store view. For label fallback, category_id
           *  scope is more stable across stores. */
          categoryScopeUid: null,
          filterFacets,
          pageSize,
          currentPage,
          sort: sortKey,
        });
        const fallbackData = await magentoGraphqlFetch<ProductsByCategoryResponse>(
          PLP_PRODUCTS_BY_CATEGORY_QUERY,
          fallbackLabelVariables,
          { storeViewCode: fallbackCode },
        );
        fallbackAggregations = fallbackData.products.aggregations ?? [];
      } catch {
        fallbackAggregations = [];
      }
    }

    if (preferredAggregations.length > 0) {
      aggregations = mergeAggregationLabels(preferredAggregations, aggregations);
    }
    if (fallbackAggregations.length > 0) {
      aggregations = mergeAggregationLabels(aggregations, fallbackAggregations);
    }

    const labelOverrides = await getAggregationAttributeLabelOverrides(
      aggregations,
      preferredCode || primaryCode,
    );
    if (labelOverrides.size > 0) {
      aggregations = aggregations.map((agg) => {
        const code = agg.attribute_code?.trim();
        if (!code) return agg;
        const label = labelOverrides.get(code);
        if (!label) return agg;
        return { ...agg, label };
      });
    }
  }
  const typeAgg = buildProductTypeAggregation(items);
  if (typeAgg.options?.length) {
    aggregations = [...aggregations, typeAgg];
  }

  return { ...data.products, items, aggregations };
}
