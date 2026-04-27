"use client";

import type { ChangeEvent } from "react";
import { useEffect, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductListSortKey } from "@/src/framework/graphql/queries/products";
import { useLanguageTranslation } from "@/src/config/language";

export type SortOption = {
  value: string;
  label: string;
};

type SortingProductProps = {
  id?: string;
  /** Current sort from the server (must match the order of `products`). */
  sortBy: ProductListSortKey;
  /** Query param name (default `sort`). */
  sortParam?: string;
  options?: SortOption[];
  /** Optional override instead of updating the URL. */
  onChange?: (value: string) => void;
  /** Fires when sort navigation is in flight (for overlay on product list). */
  onPendingChange?: (pending: boolean) => void;
};

const defaultOptions: SortOption[] = [
  { value: "position", label: "Position" },
  { value: "name", label: "Product Name" },
  { value: "price", label: "Price" },
  { value: "product_type", label: "Product Type" },
];

const SortingProduct = ({
  id = "sorter",
  sortBy,
  sortParam = "sort",
  options = defaultOptions,
  onChange,
  onPendingChange,
}: SortingProductProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { getTranslation } = useLanguageTranslation();
  const sortByLabel = getTranslation("Sort By");

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const handleChange = (value: string) => {
    if (onChange) {
      onChange(value);
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.set(sortParam, value);
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <div className="toolbar-sorter ">
      <label htmlFor={id} className="sort-by-title md:font-bold md:align-middle md:uppercase md:mr-3 md:inline-block">
        {sortByLabel}
      </label>
      <select
        id={id}
        data-role="sorter"
        className="sorter-option md:border-b cursor-pointer md:border-b-solid md:border-b-black h-8 pr-5 md:pr-0 text-base md:text-lg leading-[1.3] lg-custom:min-w-[240px]! xl-custom:min-w-[300px]!"
        value={sortBy}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          handleChange(e.target.value)
        }
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {getTranslation(opt.label)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortingProduct;
