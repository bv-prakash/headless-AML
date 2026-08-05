import PLPShopLayout from "./PLPShopLayout";
import type { CategoryBreadcrumbsData } from "@/src/framework/graphql/category/queries/getCategoryBreadcrumbs";
import { stripHtml } from "@/src/utils/html";
import type { ProductAggregation } from "@/src/framework/graphql/plp/queries/getProductsByCategory";
import type { ProductListSortKey } from "@/src/framework/graphql/plp/plpCatalogGraphql";
import type { PLPContentProduct } from "./types";
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
};

const PLPContent = ({
  products,
  sortBy,
  aggregations = [],
  categoryId,
  breadcrumbsData,
  currentPage,
  totalPages,
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
    </>
  );
};

export default PLPContent;
