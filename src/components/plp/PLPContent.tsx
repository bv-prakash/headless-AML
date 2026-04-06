import Breadcrums from "../common/Breadcrums";
import PLPShopLayout from "./PLPShopLayout";
import { getCategoryBreadcrumbs } from "@/src/framework/graphql/queries/breadcrumbs";
import { stripHtml } from "@/src/utils/html";
import type {
  ProductAggregation,
  ProductListSortKey,
} from "@/src/framework/graphql/queries/products";
import type { PLPContentProduct } from "./types";

type PLPContentProps = {
  products: PLPContentProduct[];
  sortBy: ProductListSortKey;
  aggregations?: ProductAggregation[];
  categoryId: string;
  currentPage: number;
  totalPages: number;
};

const PLPContent = async ({
  products,
  sortBy,
  aggregations = [],
  categoryId,
  currentPage,
  totalPages,
}: PLPContentProps) => {
  const { name } = await getCategoryBreadcrumbs(categoryId);

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
        <Breadcrums categoryId={categoryId} />
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
