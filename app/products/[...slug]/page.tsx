import { notFound } from "next/navigation";
import PLPContent from "@/src/components/plp/PLPContent";
import { resolveCategoryFromSlug } from "@/src/framework/graphql/queries/categoryList";
import { getCategoryBreadcrumbs } from "@/src/framework/graphql/queries/breadcrumbs";
import {
  getProductsByCategory,
  parseFacetSearchParams,
  parseProductListSortParam,
  type ProductAggregation,
} from "@/src/framework/graphql/queries/products";
import { getStoreConfig } from "@/src/framework/graphql/queries/storeConfig";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";
import { parsePageParam } from "@/src/utils/params";
import { getFallbackStoreViewCode } from "@/src/config/storeViews";

/** Per-request cookie store + catalog (matches PDP / home). */
export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_PAGE_SIZE = 12;

const CategoryPage = async ({ params, searchParams }: CategoryPageProps) => {
  type SearchParamRecord = Record<string, string | string[] | undefined>;
  const emptyParams: SearchParamRecord = {};

  const [{ slug }, sp, storeViewCode] = await Promise.all([
    params,
    searchParams?.then((v) => v ?? emptyParams) ?? Promise.resolve(emptyParams),
    getServerStoreViewCode(),
  ]);

  const fallbackStoreViewCode = getFallbackStoreViewCode(storeViewCode);
  const [storeConfig, category] = await Promise.all([
    getStoreConfig(),
    resolveCategoryFromSlug(slug, { storeViewCode }),
  ]);
  let effectiveStoreViewCode = storeViewCode;
  let resolvedCategory = category;
  if (!resolvedCategory && fallbackStoreViewCode !== storeViewCode) {
    resolvedCategory = await resolveCategoryFromSlug(slug, {
      storeViewCode: fallbackStoreViewCode,
    });
    if (resolvedCategory) effectiveStoreViewCode = fallbackStoreViewCode;
  }
  if (!resolvedCategory) notFound();

  const categoryId = String(resolvedCategory.id);

  const defaultSort = storeConfig.catalog_default_sort_by ?? "position";
  const gridPerPage = storeConfig.grid_per_page && storeConfig.grid_per_page > 0
    ? storeConfig.grid_per_page
    : DEFAULT_PAGE_SIZE;

  const sortBy = parseProductListSortParam(sp.sort ?? defaultSort);
  const currentPage = parsePageParam(sp.page);
  const filterFacets = parseFacetSearchParams(sp);

  const debugPlpRaw = sp.debug_plp;
  const debugPlpFlag = Array.isArray(debugPlpRaw)
    ? debugPlpRaw[0]
    : debugPlpRaw;
  const showPlpGraphqlDebug =
    debugPlpFlag === "1" || debugPlpFlag === "true";

  let [{ items, aggregations, total_count }, breadcrumbsData] =
    await Promise.all([
      getProductsByCategory({
        categoryId,
        categoryUid: resolvedCategory.uid,
        storeViewCode: effectiveStoreViewCode,
        aggregationLabelPreferredStoreViewCode: storeViewCode,
        aggregationLabelPreferredCategoryId: category
          ? String(category.id)
          : categoryId,
        aggregationLabelPreferredCategoryUid: category?.uid ?? null,
        aggregationLabelFallbackStoreViewCode: fallbackStoreViewCode,
        pageSize: gridPerPage,
        currentPage,
        sort: sortBy,
        filterFacets,
      }),
      getCategoryBreadcrumbs(categoryId, { storeViewCode: effectiveStoreViewCode }),
    ]);

  if (
    items.length === 0 &&
    effectiveStoreViewCode === storeViewCode &&
    fallbackStoreViewCode !== storeViewCode
  ) {
    const fallbackCategory = await resolveCategoryFromSlug(slug, {
      storeViewCode: fallbackStoreViewCode,
    });
    if (fallbackCategory) {
      const fallbackCategoryId = String(fallbackCategory.id);
      const fallbackResult = await getProductsByCategory({
        categoryId: fallbackCategoryId,
        categoryUid: fallbackCategory.uid,
        storeViewCode: fallbackStoreViewCode,
        aggregationLabelPreferredStoreViewCode: storeViewCode,
        aggregationLabelPreferredCategoryId: category
          ? String(category.id)
          : fallbackCategoryId,
        aggregationLabelPreferredCategoryUid: category?.uid ?? null,
        aggregationLabelFallbackStoreViewCode: fallbackStoreViewCode,
        pageSize: gridPerPage,
        currentPage,
        sort: sortBy,
        filterFacets,
      });
      if (fallbackResult.items.length > 0) {
        effectiveStoreViewCode = fallbackStoreViewCode;
        items = fallbackResult.items;
        aggregations = fallbackResult.aggregations;
        total_count = fallbackResult.total_count;
        breadcrumbsData = await getCategoryBreadcrumbs(fallbackCategoryId, {
          storeViewCode: fallbackStoreViewCode,
        });
      }
    }
  }

  const totalPages = Math.ceil(total_count / gridPerPage);

  const products = items.map((p) => ({
    productId: p.id,
    sku: p.sku,
    href: `/${p.url_key}`,
    imageUrl: p.small_image?.url ?? "",
    name: p.name,
    description: p.short_description?.html ?? "",
    productType: p.__typename,
    stockStatus: p.stock_status,
  }));

  return (
    <PLPContent
      products={products}
      sortBy={sortBy}
      aggregations={aggregations as ProductAggregation[]}
      categoryId={categoryId}
      breadcrumbsData={breadcrumbsData}
      currentPage={currentPage}
      totalPages={totalPages}
      plpGraphqlDebug={
        showPlpGraphqlDebug
          ? {
              filterFacets,
              pageSize: gridPerPage,
              currentPage,
              categoryUid: resolvedCategory.uid,
              storeViewCode: effectiveStoreViewCode,
            }
          : undefined
      }
    />
  );
};

export default CategoryPage;
