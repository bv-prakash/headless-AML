"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLazyQuery } from "@apollo/client/react";
import { stripHtml } from "@/src/utils/html";
import { useClickOutside } from "@/src/hooks/useClickOutside";
import {
  PRODUCT_SEARCH_QUERY,
  SEARCH_RESULTS_PAGE_SIZE,
  type ProductSearchResponse,
  type ProductSearchVariables,
} from "@/src/framework/graphql/queries/searchProducts";

const MIN_CHARS = 3;
const DEBOUNCE_MS = 350;

export default function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, { data, loading }] = useLazyQuery<
    ProductSearchResponse,
    ProductSearchVariables
  >(PRODUCT_SEARCH_QUERY, { fetchPolicy: "cache-and-network" });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.trim().length >= MIN_CHARS) {
        debounceRef.current = setTimeout(() => {
          search({ variables: { search: value.trim(), pageSize: SEARCH_RESULTS_PAGE_SIZE } });
          setOpen(true);
        }, DEBOUNCE_MS);
      } else {
        setOpen(false);
      }
    },
    [search],
  );

  const closeDropdown = useCallback(() => setOpen(false), []);
  useClickOutside(wrapperRef, closeDropdown);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const items = data?.products?.items ?? [];
  const totalCount = data?.products?.total_count ?? 0;
  const remaining = totalCount - items.length;
  const showDropdown = open && query.trim().length >= MIN_CHARS;

  const handleResultClick = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  return (
    <div ref={wrapperRef} className={`relative flex-1 max-w-[420px] ${className ? className : ""}`}>
      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (query.trim().length >= MIN_CHARS && items.length > 0) {
              setOpen(true);
            }
          }}
          placeholder="Search"
          className="w-full h-7.5 pl-2.5 pr-[35px] text-sm uppercase text-black bg-f0f0f0 border-f0f0f0 focus:outline-none focus:border-theme-primary transition-colors"
          aria-label="Search products"
          aria-expanded={showDropdown}
          aria-controls="search-results-dropdown"
          role="combobox"
          aria-autocomplete="list"
        />
        {query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute flex items-center justify-center right-3 top-1/2 -translate-y-1/2 cursor-pointer text-black hover:text-theme-primary transition-colors"
            aria-label="Clear search"
          >
            <i className="icon-cross-icon text-lg leading-1" aria-hidden="true" />
          </button>
        ) : (
          <i
            className="icon-search absolute right-3 top-1/2 -translate-y-1/2 text-black text-lg leading-1"
            aria-hidden="true"
          />
        )}

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-theme-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          id="search-results-dropdown"
          role="listbox"
          className="absolute top-full left-0 w-full pt-2.5 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-[480px] overflow-y-auto"
        >
          {loading && items.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-theme-primary animate-spin" />
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No products found for &ldquo;{query}&rdquo;
            </div>
          )}

          {items.length > 0 && (
            <>
                <div className="flex items-center text-base font-normal justify-between p-0 pb-5 px-[15px]">
                    {/* Total count */}
                    <div>
                        product{totalCount !== 1 ? "s" : ""} ({totalCount})
                    </div>

                    {/* View more */}
                    {remaining > 0 && (
                        <Link
                        href={`/catalogsearch/result?q=${encodeURIComponent(query.trim())}`}
                        onClick={handleResultClick}
                        className="font-semibold text-theme-primary hover:underline transition-colors"
                        >
                        View all (+{remaining})
                        </Link>
                    )}
                </div>

              {/* Product list */}
              <ul>
                {items.map((product) => {
                  const description = product.short_description?.html
                    ? stripHtml(product.short_description.html)
                    : "";

                  return (
                    <li key={product.sku} role="option">
                      <Link
                        href={`/${product.url_key}`}
                        onClick={handleResultClick}
                        className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        {/* Image */}
                        <div className="w-[50px] h-[50px] shrink-0 border border-gray-100 rounded overflow-hidden">
                          {product.small_image?.url ? (
                            <Image
                              src={product.small_image.url}
                              alt={product.name}
                              width={50}
                              height={50}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 text-[10px]">
                              No img
                            </div>
                          )}
                        </div>

                        {/* Name + description */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black line-clamp-1">
                            {product.name}
                          </p>
                          {description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {description}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
