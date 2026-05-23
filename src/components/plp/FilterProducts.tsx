"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FACET_PARAM_PREFIX,
  type ProductAggregation,
} from "@/src/framework/graphql/plp/queries/getProductsByCategory";
import { useLanguageTranslation } from "@/src/config/language";
import { useAppSelector } from "@/src/store/hooks";
import { selectStoreViewCode } from "@/src/store/selectors";

type FilterProductsProps = {
  aggregations: ProductAggregation[];
  onPendingChange?: (pending: boolean) => void;
};

type ActiveFacetItem = {
  attributeCode: string;
  attributeLabel: string;
  value: string;
  valueLabel: string;
};

function getFacetSelections(searchParams: URLSearchParams): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  searchParams.forEach((val, key) => {
    if (!key.startsWith(FACET_PARAM_PREFIX)) return;
    const code = key.slice(FACET_PARAM_PREFIX.length);
    if (!code) return;
    const set = map.get(code) ?? new Set<string>();
    val
      .split(/[,+]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((v) => set.add(v));
    map.set(code, set);
  });
  return map;
}

function buildActiveFacetItems(
  aggregations: ProductAggregation[],
  searchParams: URLSearchParams,
): ActiveFacetItem[] {
  const items: ActiveFacetItem[] = [];
  const selections = getFacetSelections(searchParams);
  selections.forEach((values, code) => {
    const agg = aggregations.find((a) => a.attribute_code === code);
    const attrLabel = agg?.label ?? code;
    values.forEach((v) => {
      const opt = agg?.options?.find((o) => o.value === v);
      items.push({
        attributeCode: code,
        attributeLabel: attrLabel,
        value: v,
        valueLabel: opt?.label ?? v,
      });
    });
  });
  return items;
}

function removeFacetValueHref(
  pathname: string,
  searchParams: URLSearchParams,
  attributeCode: string,
  valueToRemove: string,
): string {
  const next = new URLSearchParams(searchParams.toString());
  const key = `${FACET_PARAM_PREFIX}${attributeCode}`;
  const raw = next.get(key);
  if (!raw) return `${pathname}?${next.toString()}`.replace(/\?$/, "");
  const rest = raw
    .split(/[,+]/)
    .map((s) => s.trim())
    .filter((v) => v && v !== valueToRemove);
  if (rest.length === 0) next.delete(key);
  else next.set(key, rest.join(","));
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export default function FilterProducts({
  aggregations,
  onPendingChange,
}: FilterProductsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const filterRef = useRef<HTMLDivElement>(null);
  const { getTranslation } = useLanguageTranslation();
  const storeViewCode = useAppSelector(selectStoreViewCode);
  const filterOptionsLabel = getTranslation("Filter Options");
  const resetAllLabel = getTranslation("Reset All");
  const noFiltersAvailableLabel = getTranslation(
    "No filters available for this category.",
  );
  const removeLabel = getTranslation("Remove");

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const blocks = useMemo(
    () =>
      (aggregations ?? []).filter((a) => a?.options?.length && a.attribute_code),
    [aggregations],
  );

  const activeItems = useMemo(
    () => buildActiveFacetItems(aggregations, searchParams),
    [aggregations, searchParams],
  );

  const navigateWithParams = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router],
  );

  const toggleFacetValue = useCallback(
    (attributeCode: string, optionValue: string, checked: boolean) => {
      const next = new URLSearchParams(searchParams.toString());
      const key = `${FACET_PARAM_PREFIX}${attributeCode}`;
      const current = new Set(
        (next.get(key)?.split(/[,+]/) ?? [])
          .map((s) => s.trim())
          .filter(Boolean),
      );
      if (checked) current.add(optionValue);
      else current.delete(optionValue);
      if (current.size === 0) next.delete(key);
      else next.set(key, [...current].join(","));
      navigateWithParams(next);
    },
    [navigateWithParams, searchParams],
  );

  const resetAllFilters = useCallback(() => {
    filterRef.current
      ?.querySelectorAll<HTMLDetailsElement>("details[open]")
      .forEach((d) => d.removeAttribute("open"));

    const next = new URLSearchParams(searchParams.toString());
    [...next.keys()]
      .filter((k) => k.startsWith(FACET_PARAM_PREFIX))
      .forEach((k) => next.delete(k));
    navigateWithParams(next);
  }, [navigateWithParams, searchParams]);

  const isOptionChecked = (attributeCode: string, optionValue: string) => {
    const key = `${FACET_PARAM_PREFIX}${attributeCode}`;
    const raw = searchParams.get(key);
    if (!raw) return false;
    return raw
      .split(/[,+]/)
      .map((s) => s.trim())
      .includes(optionValue);
  };

  if (!blocks.length) {
    return (
      <div className="sidebar-filters text-sm text-foreground/60">
        {noFiltersAvailableLabel}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Collapsible facet panels */}
      <div ref={filterRef} className="block filter filter-products md:mb-10">
        <div className="flex justify-between items-center mb-3">
          <strong className="hidden md:block md:static uppercase font-normal text-[17px] lg:shadow-none lg:text-[22px] lg-custom:text-[24px]!">
            {filterOptionsLabel}
          </strong>
          {activeItems.length > 0 && (
            <button
            type="button"
            className="text-sm font-semibold text-theme-primary underline hover:no-underline cursor-pointer"
            onClick={resetAllFilters}
          >
            {resetAllLabel}
          </button>
          )}
        </div>

        {/* Amasty-style current filters */}
        {activeItems.length > 0 && (
            <div
              className="filter-current pb-2.5 my-5 mx-0 border-b border-black md:m-0 md:border-0  lg-custom:pb-3! "
            >
            <ol className="amshopby-items items m-0 list-none space-y-3 p-0">
              {activeItems.map((item) => {
                const removeHref = removeFacetValueHref(
                  pathname,
                  searchParams,
                  item.attributeCode,
                  item.value,
                );
                return (
                  <li
                    key={`${item.attributeCode}-${item.value}`}
                    className="item relative  flex my-2.5 mx-0 items-center flex-wrap pl-5 "
                    data-container={item.attributeCode}
                    data-value={item.value}
                  >
                    <button
                      type="button"
                      className="flex justify-center cursor-pointer items-center absolute left-0 h-3 w-3 top-2"
                      aria-label={`${removeLabel} ${item.attributeLabel} ${item.valueLabel}`}
                      title={`${removeLabel} ${item.attributeLabel} ${item.valueLabel}`}
                      onClick={() => {
                        startTransition(() => {
                          router.push(removeHref);
                        });
                      }}
                    >
                      <span aria-hidden className="flex items-center justify-center">
                        <i className="icon-cross-icon text-base leading-none before:font-normal"></i>
                      </span>
                    </button>
                    <span className="filter-name block text-base lg-custom:text-lg font-semibold uppercase text-black pr-[5px]">
                      {item.attributeLabel}{":"}
                    </span>
                    <div className="filter-value text-base lg-custom:text-lg! uppercase text-black">
                      {item.valueLabel}
                    </div>
                  </li>
                );
              })}
            </ol>
        </div>
        )}

        <div className="filter-options">
          {blocks.map((agg) => {
            const code = agg.attribute_code ?? "";
            const options = agg.options ?? [];

            return (
              <details
                key={code}
                className="filter-options-item group border-b border-black"
              >
                <summary className="filter-options-title flex cursor-pointer list-none items-center justify-between gap-2 py-2.5 px-0 uppercase text-base lg:text-lg! font-normal text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                  <span>{agg.label ?? code}</span>
                  <span
                    className="text-theme-primary duration-200 transition-transform rotate-270 group-open:rotate-90"
                    aria-hidden
                  >
                    <i className="icon-back-arrow text-lg before:font-semibold leading-none"></i>
                  </span>
                </summary>
                <div className="m-0 py-[15px] px-0 lg-custom:px-0! lg-custom:pt-2! lg-custom:pb-4.5!">
                  <ul className="filter-options-list m-0 max-h-60 list-none space-y-2 overflow-y-auto p-0">
                    {options.map((opt, idx) => {
                      const val = opt.value ?? "";
                      const id = `facet-${code}-${idx}`;
                      const checked = isOptionChecked(code, val);
                      return (
                        <li
                          key={`${code}-${val}-${idx}`}
                          className="filter-options-item flex items-start gap-2 text-sm leading-[1.3] md:text-base"
                        >
                          <input
                            type="checkbox"
                            id={id}
                            checked={checked}
                            onChange={(e) =>
                              toggleFacetValue(code, val, e.target.checked)
                            }
                            className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-dbdcda text-theme-primary "
                          />
                          <label
                            htmlFor={id}
                            className="cursor-pointer text-black py-[5px] text-sm leading-[1.3]"
                          >
                            <span className="filter-label">
                              {opt.label ?? val}
                            </span>
                            {typeof opt.count === "number" ? (
                              <span className="ml-1 hidden text-foreground/50">
                                ({opt.count})
                              </span>
                            ) : null}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
