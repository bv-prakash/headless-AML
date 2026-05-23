"use client";

import { useState } from "react";
import FilterProducts from "./FilterProducts";
import PLPMainColumn from "./PLPMainColumn";
import type { ProductAggregation } from "@/src/framework/graphql/plp/queries/getProductsByCategory";
import type { ProductListSortKey } from "@/src/framework/graphql/plp/plpCatalogGraphql";
import type { PLPContentProduct } from "./types";

type PLPShopLayoutProps = {
  aggregations: ProductAggregation[];
  products: PLPContentProduct[];
  sortBy: ProductListSortKey;
  currentPage: number;
  totalPages: number;
};

export default function PLPShopLayout({
  aggregations,
  products,
  sortBy,
  currentPage,
  totalPages,
}: PLPShopLayoutProps) {
  const [sortNavPending, setSortNavPending] = useState(false);
  const [filterNavPending, setFilterNavPending] = useState(false);
  const [pageNavPending, setPageNavPending] = useState(false);
  const listLoading = sortNavPending || filterNavPending || pageNavPending;

  return (
    <div className="container relative z-1 flex flex-wrap md:block">
      {aggregations && aggregations.length > 0 && (
        <aside className="sidebar-content grow basis-full md:float-left md:w-[23%] md:min-h-[300px] lg-custom:pr-[2%]!">
        <div className="sidebar-content">
          <FilterProducts
            aggregations={aggregations}
            onPendingChange={setFilterNavPending}
          />
          </div>
      </aside>)}
      <PLPMainColumn
        sortBy={sortBy}
        products={products}
        listLoading={listLoading}
        onSortPendingChange={setSortNavPending}
        currentPage={currentPage}
        totalPages={totalPages}
        onPagePendingChange={setPageNavPending}
      />
    </div>
  );
}
