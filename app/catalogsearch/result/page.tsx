import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import PageLoader from "@/src/components/common/loader/PageLoader";
import PLPShopLayout from "@/src/components/plp/PLPShopLayout";
import { searchProducts } from "@/src/framework/graphql/search/queries/searchProducts";
import { stripHtml } from "@/src/utils/html";
import { getStoreConfig } from "@/src/framework/graphql/store/queries/getStoreConfig";
import {
  parseFacetSearchParams,
  parseProductListSortParam,
  type ProductAggregation,
} from "@/src/framework/graphql/plp/queries/getProductsByCategory";
import { parsePageParam } from "@/src/utils/params";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_PAGE_SIZE = 12;

const SORT_MAP: Record<string, Record<string, string>> = {
  position: { position: "ASC" },
  name: { name: "ASC" },
};

function buildFilterInput(
  facets: Record<string, string[]>,
): Record<string, { eq?: string; in?: string[] }> {
  const filter: Record<string, { eq?: string; in?: string[] }> = {};

  for (const [code, values] of Object.entries(facets)) {
    const unique = [...new Set(values)].filter(Boolean);
    if (unique.length === 0) continue;
    filter[code] = unique.length === 1 ? { eq: unique[0] } : { in: unique };
  }

  return filter;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const term = q?.trim() ?? "";

  return {
    title: term ? `Search results for: '${term}'` : "Search",
  };
}

export default async function SearchResultsPage({
  searchParams,
}: SearchPageProps) {
  const sp = (await searchParams) ?? {};
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const term = q?.trim() ?? "";

  if (!term) redirect("/");

  const currentPage = parsePageParam(sp.page);
  const sortBy = parseProductListSortParam(sp.sort);
  const filterFacets = parseFacetSearchParams(sp);
  const filter = buildFilterInput(filterFacets);
  const sort = SORT_MAP[sortBy] ?? SORT_MAP.position;

  const storeConfig = await getStoreConfig();
  const pageSize =
    storeConfig.grid_per_page && storeConfig.grid_per_page > 0
      ? storeConfig.grid_per_page
      : DEFAULT_PAGE_SIZE;

  const { items, totalCount, aggregations } = await searchProducts({
    searchTerm: term,
    pageSize,
    currentPage,
    filter,
    sort,
  });
  const totalPages = Math.ceil(totalCount / pageSize);

  const products = items
    .map((p) => ({
      productId: p.id,
      sku: p.sku,
      href: `/${p.url_key}`,
      imageUrl: p.small_image?.url ?? "",
      name: p.name,
      description: p.short_description?.html
        ? stripHtml(p.short_description.html)
        : undefined,
      productType: p.__typename,
      stockStatus: p.stock_status,
    }))
    .filter((p) => Boolean(p.imageUrl));

  return (
    <Suspense
      fallback={
        <PageLoader label="Searching…" minHeightClassName="min-h-[50vh]" />
      }
    >
      <div className="container relative mb-[25px] mt-5 lg-custom:mb-7.5!">
        <h1 className="text-xl leading-[1.1] mb-[5px] md:mb-2.5 mt-0 font-bold md:text-[26px] lg-custom:text-[32px]!">
          Search results for: &lsquo;{term}&rsquo;
        </h1>
        <p className="text-sm text-gray-500">
          {totalCount} product{totalCount !== 1 ? "s" : ""} found
        </p>
      </div>

      {items.length === 0 ? (
        <div className="container text-center py-16 text-gray-500">
          <p className="text-lg mb-4">No products matched your search term.</p>
          <Link
            href="/"
            className="text-theme-primary underline hover:no-underline"
          >
            Return to Home
          </Link>
        </div>
      ) : (
        <PLPShopLayout
          aggregations={aggregations as ProductAggregation[]}
          products={products}
          sortBy={sortBy}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}
    </Suspense>
  );
}
