import { notFound } from "next/navigation";
import { Suspense } from "react";
import PLPContent from "@/src/components/plp/PLPContent";
import PageLoader from "@/src/components/common/PageLoader";
import {
  getCategoryByUrlPath,
  getCategoryChildren,
} from "@/src/framework/graphql/queries/categoryList";
import {
  getProductsByCategory,
  parseFacetSearchParams,
  parseProductListSortParam,
  type ProductAggregation,
} from "@/src/framework/graphql/queries/products";
import { getStoreConfig } from "@/src/framework/graphql/queries/storeConfig";

type CategoryPageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_PAGE_SIZE = 12;

function parsePageParam(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(v ?? "", 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

const CategoryPage = async ({ params, searchParams }: CategoryPageProps) => {
  type SearchParamRecord = Record<string, string | string[] | undefined>;
  const emptyParams: SearchParamRecord = {};

  const [{ slug }, sp, storeConfig] = await Promise.all([
    params,
    searchParams?.then((v) => v ?? emptyParams) ?? Promise.resolve(emptyParams),
    getStoreConfig(),
  ]);

  const urlPath = slug.join("/");
  const category = await getCategoryByUrlPath(urlPath);
  if (!category) notFound();

  const categoryId = String(category.id);

  const defaultSort = storeConfig.catalog_default_sort_by ?? "position";
  const gridPerPage = storeConfig.grid_per_page && storeConfig.grid_per_page > 0
    ? storeConfig.grid_per_page
    : DEFAULT_PAGE_SIZE;

  const sortBy = parseProductListSortParam(sp.sort ?? defaultSort);
  const currentPage = parsePageParam(sp.page);
  const filterFacets = parseFacetSearchParams(sp);

  const { children } = await getCategoryChildren(categoryId);
  const childCategoryIds = children.map((c) => c.id);
  const childCategoryUids = children.map((c) => c.uid).filter(Boolean);

  const { items, aggregations, total_count } = await getProductsByCategory({
    categoryId,
    pageSize: gridPerPage,
    currentPage,
    sort: sortBy,
    filterFacets,
    childCategoryIds,
    childCategoryUids,
  });

  const totalPages = Math.ceil(total_count / gridPerPage);

  const products = items
    .map((p) => ({
      productId: p.id,
      sku: p.sku,
      href: `/${p.url_key}`,
      imageUrl: p.small_image?.url ?? "",
      name: p.name,
      description: p.short_description?.html ?? "",
      productType: p.__typename,
      stockStatus: p.stock_status,
    }))
    .filter((p) => Boolean(p.imageUrl));

  return (
    <Suspense
      fallback={
        <PageLoader
          label="Loading products…"
          minHeightClassName="min-h-[50vh]"
        />
      }
    >
      <PLPContent
        products={products}
        sortBy={sortBy}
        aggregations={aggregations as ProductAggregation[]}
        categoryId={categoryId}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </Suspense>
  );
};

export default CategoryPage;
