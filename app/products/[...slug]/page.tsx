import { notFound } from "next/navigation";
import { Suspense } from "react";
import PLPContent from "@/src/components/plp/PLPContent";
import PageLoader from "@/src/components/common/PageLoader";
import { getCategoryByUrlPath } from "@/src/framework/graphql/queries/categoryList";
import {
  getProductsByCategory,
  parseFacetSearchParams,
  parseProductListSortParam,
  ProductAggregation,
} from "@/src/framework/graphql/queries/products";

type CategoryPageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const CategoryPage = async ({ params, searchParams }: CategoryPageProps) => {
  const { slug } = await params;
  const urlPath = slug.join("/");

  const category = await getCategoryByUrlPath(urlPath);
  if (!category) notFound();

  const categoryId = String(category.id);
  const sp = (await searchParams) ?? {};
  const sortBy = parseProductListSortParam(sp.sort);
  const filterFacets = parseFacetSearchParams(sp);

  const { items, aggregations } = await getProductsByCategory({
    categoryId,
    pageSize: 20,
    currentPage: 1,
    sort: sortBy,
    filterFacets,
  });

  const products = items
    .map((p) => ({
      sku: p.sku,
      href: `/${p.url_key}`,
      imageUrl: p.small_image?.url ?? "",
      name: p.name,
      description: p.short_description?.html ?? "",
    }))
    .filter((p) => Boolean(p.imageUrl));

  return (
    <Suspense
      fallback={<PageLoader label="Loading products…" minHeightClassName="min-h-[50vh]" />}
    >
      <PLPContent
        products={products}
        sortBy={sortBy}
        aggregations={aggregations as ProductAggregation[]}
        categoryId={categoryId}
      />
    </Suspense>
  );
};

export default CategoryPage;
