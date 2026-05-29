import { notFound } from "next/navigation";
import PLPContent from "@/src/components/plp/PLPContent";
import { resolveCategoryFromSlug } from "@/src/framework/graphql/category/queries/getCategoryList";
import { getCategoryBreadcrumbs } from "@/src/framework/graphql/category/queries/getCategoryBreadcrumbs";
import {
  getProductsByCategory,
  parseFacetSearchParams,
  parseProductListSortParam,
  type ProductAggregation,
} from "@/src/framework/graphql/plp/queries/getProductsByCategory";
import { getStoreConfig } from "@/src/framework/graphql/store/queries/getStoreConfig";
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
  let fallbackCategoryResolved = null as Awaited<
    ReturnType<typeof resolveCategoryFromSlug>
  >;
  let effectiveStoreViewCode = storeViewCode;
  let resolvedCategory = category;
  if (!resolvedCategory && fallbackStoreViewCode !== storeViewCode) {
    fallbackCategoryResolved = await resolveCategoryFromSlug(slug, {
      storeViewCode: fallbackStoreViewCode,
    });
    resolvedCategory = fallbackCategoryResolved;
    if (resolvedCategory) effectiveStoreViewCode = fallbackStoreViewCode;
  }
  if (!resolvedCategory) notFound();

  let effectiveCategory = resolvedCategory;
  let effectiveCategoryId = String(effectiveCategory.id);

  const defaultSort = storeConfig.catalog_default_sort_by ?? "position";
  const gridPerPage = storeConfig.grid_per_page && storeConfig.grid_per_page > 0
    ? storeConfig.grid_per_page
    : DEFAULT_PAGE_SIZE;

  const sortBy = parseProductListSortParam(sp.sort ?? defaultSort);
  const currentPage = parsePageParam(sp.page);
  const filterFacets = parseFacetSearchParams(sp);

  let [{ items, aggregations, total_count }, breadcrumbsData] =
    await Promise.all([
      getProductsByCategory({
        categoryId: effectiveCategoryId,
        categoryUid: effectiveCategory.uid,
        storeViewCode: effectiveStoreViewCode,
        aggregationLabelPreferredStoreViewCode: storeViewCode,
        aggregationLabelPreferredCategoryId: category
          ? String(category.id)
          : effectiveCategoryId,
        aggregationLabelPreferredCategoryUid: category?.uid ?? null,
        aggregationLabelFallbackStoreViewCode:
          effectiveStoreViewCode === fallbackStoreViewCode ? undefined : fallbackStoreViewCode,
        pageSize: gridPerPage,
        currentPage,
        sort: sortBy,
        filterFacets,
      }),
      getCategoryBreadcrumbs(effectiveCategoryId, { storeViewCode: effectiveStoreViewCode }),
    ]);

  if (
    items.length === 0 &&
    effectiveStoreViewCode === storeViewCode &&
    fallbackStoreViewCode !== storeViewCode
  ) {
    const fallbackCategory = fallbackCategoryResolved
      ?? (await resolveCategoryFromSlug(slug, {
        storeViewCode: fallbackStoreViewCode,
      }));
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
        aggregationLabelFallbackStoreViewCode: undefined,
        pageSize: gridPerPage,
        currentPage,
        sort: sortBy,
        filterFacets,
      });
      if (fallbackResult.items.length > 0) {
        effectiveStoreViewCode = fallbackStoreViewCode;
        effectiveCategory = fallbackCategory;
        effectiveCategoryId = fallbackCategoryId;
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
      categoryId={effectiveCategoryId}
      breadcrumbsData={breadcrumbsData}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
};

export default CategoryPage;
