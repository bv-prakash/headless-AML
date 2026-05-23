// import Breadcrumbs from "../common/Breadcrumbs";
import PLPShopLayout from "./PLPShopLayout";
import type { CategoryBreadcrumbsData } from "@/src/framework/graphql/category/queries/getCategoryBreadcrumbs";
import { stripHtml } from "@/src/utils/html";
import type { ProductAggregation } from "@/src/framework/graphql/plp/queries/getProductsByCategory";
import type { ProductListSortKey } from "@/src/framework/graphql/plp/plpCatalogGraphql";
import type { PLPContentProduct } from "./types";
import PlpGraphqlDebugLazy from "./PlpGraphqlDebugLazy";
import ServerBreadcrumbs from "./ServerBreadcrumbs";

type PLPContentProps = {
  products: PLPContentProduct[];
  sortBy: ProductListSortKey;
  aggregations?: ProductAggregation[];
  categoryId: string;
  /** From {@link getCategoryBreadcrumbs} on the page — keeps PLP synchronous so the products query is not deferred behind breadcrumbs. */
  breadcrumbsData: CategoryBreadcrumbsData;
  currentPage: number;
  totalPages: number;
  /** When set, renders a client panel that POSTs the PLP query to `/api/graphql-proxy`. Add `?debug_plp=1` to the URL. */
  plpGraphqlDebug?: {
    readonly filterFacets: Record<string, string[]>;
    readonly pageSize: number;
    readonly currentPage: number;
    /** Same as server PLP — probe can retry with `category_uid` when `category_id` returns zero. */
    readonly categoryUid?: string | null;
    /** Same `Store` header as SSR for `/api/graphql-proxy` (matches catalog scope). */
    readonly storeViewCode: string;
  };
};

const PLPContent = ({
  products,
  sortBy,
  aggregations = [],
  categoryId,
  breadcrumbsData,
  currentPage,
  totalPages,
  plpGraphqlDebug,
}: PLPContentProps) => {
  const { name } = breadcrumbsData;

  const items = products.map((p) => ({
    ...p,
    description: p.description ? stripHtml(p.description) : undefined,
  }));

  return (
    <>
      <div className="container relative mb-[25px] mt-5 lg-custom:mb-7.5!">
        <h1 className="text-xl leading-[1.1] mb-[5px] md:mb-2.5 mt-0 font-bold md:text-[26px] lg-custom:text-[32px]!">
          {name || "Products"}
        </h1>
        {/* <Breadcrumbs categoryId={categoryId} /> */}
        <ServerBreadcrumbs
          categoryId={categoryId}
          prefetched={breadcrumbsData}
        />
      </div>
      <PLPShopLayout
        aggregations={aggregations}
        products={items}
        sortBy={sortBy}
        currentPage={currentPage}
        totalPages={totalPages}
      />
      {plpGraphqlDebug ? (
        <PlpGraphqlDebugLazy
          categoryId={categoryId}
          categoryUid={plpGraphqlDebug.categoryUid}
          storeViewCode={plpGraphqlDebug.storeViewCode}
          filterFacets={plpGraphqlDebug.filterFacets}
          pageSize={plpGraphqlDebug.pageSize}
          currentPage={plpGraphqlDebug.currentPage}
          sortBy={sortBy}
        />
      ) : null}
    </>
  );
};

export default PLPContent;
