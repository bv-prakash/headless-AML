"use client";

/**
 * Luma-style `pager` toolbar for any list: pass `getPageHref(page, pageSize)` so links work on any route
 * and query scheme (e.g. merge with existing `useSearchParams()` for filters).
 *
 * @example
 * const pathname = usePathname();
 * const getPageHref = useMemo(() => createPathnamePageHref(pathname), [pathname]);
 * <ListPager totalCount={n} currentPage={p} pageSize={s} getPageHref={getPageHref} />
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { listToolbarAmountLabel, totalPagesFor } from "@/src/utils/listPagination";

type PagerEntry =
  | { kind: "page"; page: number; current: boolean }
  | { kind: "ellipsis"; jumpTo: number; key: string };

function visibleSortedPages(currentPage: number, totalPages: number): number[] {
  const pages = new Set<number>([1, totalPages]);
  const addRange = (from: number, to: number) => {
    for (let p = from; p <= to; p++) {
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
  };
  addRange(currentPage - 2, currentPage + 2);
  if (currentPage <= 4) addRange(1, Math.min(5, totalPages));
  if (currentPage >= totalPages - 3) addRange(Math.max(1, totalPages - 4), totalPages);
  return [...pages].sort((a, b) => a - b);
}

function sortedPagesToEntries(sorted: number[], currentPage: number): PagerEntry[] {
  const out: PagerEntry[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i];
    if (i > 0) {
      const prev = sorted[i - 1];
      if (n - prev > 1) {
        const jumpTo = Math.min(n - 1, Math.max(prev + 1, Math.floor((prev + n) / 2)));
        out.push({ kind: "ellipsis", jumpTo, key: `gap-${prev}-${n}` });
      }
    }
    out.push({ kind: "page", page: n, current: n === currentPage });
  }
  return out;
}

function buildPagerEntries(currentPage: number, totalPages: number): PagerEntry[] {
  if (totalPages <= 0) return [];
  if (totalPages === 1) {
    return [{ kind: "page", page: 1, current: true }];
  }
  const sorted = visibleSortedPages(currentPage, totalPages);
  return sortedPagesToEntries(sorted, currentPage);
}

export type ListPagerProps = {
  readonly totalCount: number;
  readonly currentPage: number;
  readonly pageSize: number;
  /**
   * Full URL for this list at the given page and page size.
   * Example: `createPathnamePageHref(pathname)` or merge extra filters:
   * `(p, s) => \`\${pathname}?\${mergeParams(searchParams, { p, limit: s })}\``
   */
  readonly getPageHref: (page: number, pageSize: number) => string;
  readonly pageSizeOptions?: readonly number[];
  readonly limiterId?: string;
  readonly pagingLabelId?: string;
  readonly className?: string;
  /** Set false when page size is fixed server-side. Default true. */
  readonly showLimiter?: boolean;
  /** Set false to hide Previous / Next. Default true. */
  readonly showPrevNext?: boolean;
};

export function ListPager({
  totalCount,
  currentPage,
  pageSize,
  getPageHref,
  pageSizeOptions = [10, 20, 50],
  limiterId = "limiter",
  pagingLabelId = "paging-label",
  className = "",
  showLimiter = true,
  showPrevNext = true,
}: ListPagerProps) {
  const router = useRouter();
  const totalPages = totalPagesFor(totalCount, pageSize);
  const sizes = pageSizeOptions.length > 0 ? pageSizeOptions : [10, 20, 50];

  const rootClass = ["pager flex flex-wrap items-center gap-4 md:gap-6 justify-between mt-6", className]
    .filter(Boolean)
    .join(" ");

  if (totalCount <= 0) {
    return (
      <div className={rootClass}>
        <p className="toolbar-amount  text-black">
          <span className="toolbar-number">0 items</span>
        </p>
      </div>
    );
  }

  const entries = buildPagerEntries(currentPage, totalPages);
  const showPrev = showPrevNext && currentPage > 1;
  const showNext = showPrevNext && currentPage < totalPages;

  return (
    <div className={rootClass}>
      <p className="toolbar-amount m-0 text-black order-1 md:order-0">
        <span className="toolbar-number">{listToolbarAmountLabel(totalCount, currentPage, pageSize)}</span>
      </p>

      {totalPages > 1 ? (
        <div className="pages order-3 md:order-0 w-full md:w-auto flex justify-center md:block">
          <strong className="label pages-label sr-only" id={pagingLabelId}>
            Page
          </strong>
          <ul
            className="items pages-items flex flex-wrap list-none m-0 p-0 gap-1 items-center justify-center"
            aria-labelledby={pagingLabelId}
          >
            {showPrev ? (
              <li className="item pages-item-previous">
                <Link
                  href={getPageHref(currentPage - 1, pageSize)}
                  className="action previous text-theme-primary hover:underline px-2 py-1"
                  scroll={false}
                  prefetch={false}
                >
                  <span className="label sr-only">Page</span>
                  <span>Previous</span>
                </Link>
              </li>
            ) : null}

            {entries.map((entry) => {
              if (entry.kind === "ellipsis") {
                return (
                  <li key={entry.key} className="item">
                    <Link
                      href={getPageHref(entry.jumpTo, pageSize)}
                      className="page next jump text-theme-primary hover:underline px-2 py-1 inline-block"
                      aria-label={`Skip to page ${entry.jumpTo}`}
                      scroll={false}
                      prefetch={false}
                    >
                      <span>...</span>
                    </Link>
                  </li>
                );
              }
              const { page, current } = entry;
              if (current) {
                return (
                  <li key={page} className="item current">
                    <strong className="page min-w-9 justify-center w-9 h-9 flex items-center px-2 py-1 border border-theme-primary bg-theme-primary text-white text-sm">
                      <span className="label sr-only">You&apos;re currently reading page</span>
                      <span>{page}</span>
                    </strong>
                  </li>
                );
              }
              return (
                <li key={page} className="item">
                  <Link
                    href={getPageHref(page, pageSize)}
                    className="page text-theme-primary w-9 h-9 flex items-center border border-aaa hover:bg-theme-primary hover:text-white hover:border-theme-primary justify-center px-2 py-1"
                    scroll={false}
                    prefetch={false}
                  >
                    <span className="label sr-only">Page</span>
                    <span className="">{page}</span>
                  </Link>
                </li>
              );
            })}

            {showNext ? (
              <li className="item pages-item-next">
                <Link
                  href={getPageHref(currentPage + 1, pageSize)}
                  className="action next text-theme-primary hover:underline px-2 py-1"
                  title="Next"
                  scroll={false}
                  prefetch={false}
                >
                  <span className="label sr-only">Page</span>
                  <span>Next</span>
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {showLimiter ? (
        <div className="limiter flex items-center gap-2 order-2 md:order-0">
          <strong className="limiter-label font-semibold">Show</strong>
          <select
            id={limiterId}
            className="limiter-options border border-ccc  px-2 py-1.5 bg-white text-black min-w-18"
            value={pageSize}
            aria-label="Results per page"
            onChange={(e) => {
              const next = Number.parseInt(e.target.value, 10);
              const safe = sizes.includes(next) ? next : sizes[0];
              router.push(getPageHref(1, safe), { scroll: false });
            }}
          >
            {sizes.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="limiter-text">per page</span>
        </div>
      ) : null}
    </div>
  );
}
