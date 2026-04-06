"use client";

import PLPProductCard from "./PLPProductCard";
import SortingProduct from "./SortingProduct";
import Pagination from "./Pagination";
import type { ProductListSortKey } from "@/src/framework/graphql/queries/products";
import type { PLPContentProduct } from "./types";

type PLPMainColumnProps = {
  sortBy: ProductListSortKey;
  products: PLPContentProduct[];
  listLoading: boolean;
  onSortPendingChange?: (pending: boolean) => void;
  currentPage: number;
  totalPages: number;
  onPagePendingChange?: (pending: boolean) => void;
};

export default function PLPMainColumn({
  sortBy,
  products,
  listLoading,
  onSortPendingChange,
  currentPage,
  totalPages,
  onPagePendingChange,
}: PLPMainColumnProps) {
  return (
    <div className="main-content mb-10 grow basis-auto w-full md:float-right md:w-[77%] md:min-h-[300px] md:pl-[2%]">
      <div className="toolbar md:flex md:justify-end mb-5 md:mb-7.5 lg-custom:mb-10!">
        <SortingProduct
          sortBy={sortBy}
          onPendingChange={onSortPendingChange}
        />
      </div>

      <div className="product-list relative min-h-[240px]">
        {listLoading && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[1px]"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="sr-only">Loading products</span>
            <div
              className="page-loader-spinner h-12 w-12 rounded-full border-[3px] border-solid border-f0f0f0 border-t-theme-primary animate-spin"
              aria-hidden
            />
          </div>
        )}

        <ol
          className={`product-items grid grid-cols-2 gap-x-[15px] gap-y-5 sm:gap-y-[25px] md:gap-x-5 md:grid-cols-3 lg:grid-cols-4 ${
            listLoading ? "pointer-events-none select-none opacity-50" : ""
          }`}
        >
          {products.map((p) => (
            <li
              key={p.sku}
              className="product-item text-[15px] leading-[1.3] lg-custom:text-lg!"
            >
              <PLPProductCard
                id={p.sku}
                productId={p.productId}
                href={p.href}
                imageUrl={p.imageUrl}
                name={p.name}
                description={p.description}
                productType={p.productType}
                stockStatus={p.stockStatus}
              />
            </li>
          ))}
        </ol>
      </div>

      <div className="product-list-toolbar">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPendingChange={onPagePendingChange}
        />
      </div>
    </div>
  );
}
