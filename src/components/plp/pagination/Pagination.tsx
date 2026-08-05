"use client";

import { useCallback, useEffect, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/src/components/common/controls/Button";

type PaginationProps = {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly pageParam?: string;
  readonly onPendingChange?: (pending: boolean) => void;
};

const MAX_VISIBLE_PAGES = 5;

function getPageRange(current: number, total: number): number[] {
  if (total <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(MAX_VISIBLE_PAGES / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + MAX_VISIBLE_PAGES - 1);

  if (end - start + 1 < MAX_VISIBLE_PAGES) {
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function Pagination({
  currentPage,
  totalPages,
  pageParam = "page",
  onPendingChange,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const navigateToPage = useCallback(
    (page: number) => {
      const next = new URLSearchParams(searchParams.toString());
      if (page <= 1) {
        next.delete(pageParam);
      } else {
        next.set(pageParam, String(page));
      }
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, searchParams, pageParam],
  );

  const pages = useMemo(
    () => getPageRange(currentPage, totalPages),
    [currentPage, totalPages],
  );

  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Product list pagination"
      className="flex items-center justify-center md:justify-end gap-1.5 mt-8 mb-4"
    >
      <Button
        variant="secondary"
        size="sm"
        onClick={() => navigateToPage(currentPage - 1)}
        disabled={!hasPrev}
        aria-label="Previous page"
        title="Previous"
        className="w-9 h-9 md:w-10 md:h-10"
      >
        <i
          className="icon-back-arrow text-sm leading-none"
          aria-hidden="true"
        />
      </Button>

      {pages[0] > 1 && (
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateToPage(1)}
            aria-label="Go to page 1"
            className="w-9 h-9 md:w-10 md:h-10"
          >
            1
          </Button>
          {pages[0] > 2 && (
            <span className="px-1 text-gray-400" aria-hidden="true">
              &hellip;
            </span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "primary" : "secondary"}
          size="sm"
          onClick={() => navigateToPage(page)}
          disabled={page === currentPage}
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
          className="w-9 h-9 md:w-10 md:h-10"
        >
          {page}
        </Button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-1 text-gray-400" aria-hidden="true">
              &hellip;
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateToPage(totalPages)}
            aria-label={`Go to page ${totalPages}`}
            className="w-9 h-9 md:w-10 md:h-10"
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => navigateToPage(currentPage + 1)}
        disabled={!hasNext}
        aria-label="Next page"
        title="Next"
        className="w-9 h-9 md:w-10 md:h-10"
      >
        <i
          className="icon-back-arrow text-sm leading-none rotate-180"
          aria-hidden="true"
        />
      </Button>
    </nav>
  );
}
