/**
 * URL + math helpers for Luma-style list pagination (`pager`, limiter, toolbar amount).
 * Use with {@link ListPager}: pass `getPageHref` built from `createPathnamePageHref` or your own logic.
 */

export type ListPaginationConfig = {
  readonly pageParam: string;
  readonly pageSizeParam: string;
  readonly defaultPage: number;
  readonly defaultPageSize: number;
  readonly allowedPageSizes: readonly number[];
};

/** Default `?p=&limit=` with 10 / 20 / 50 (My Account orders, etc.). */
export const LUMA_ACCOUNT_LIST_PAGINATION: ListPaginationConfig = {
  pageParam: "p",
  pageSizeParam: "limit",
  defaultPage: 1,
  defaultPageSize: 10,
  allowedPageSizes: [10, 20, 50],
};

export function parseListPaginationParams(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  config: ListPaginationConfig = LUMA_ACCOUNT_LIST_PAGINATION,
): { page: number; pageSize: number } {
  const rawP = Number.parseInt(String(searchParams.get(config.pageParam) ?? String(config.defaultPage)), 10);
  const page = Number.isFinite(rawP) && rawP >= 1 ? rawP : config.defaultPage;
  const rawL = Number.parseInt(
    String(searchParams.get(config.pageSizeParam) ?? String(config.defaultPageSize)),
    10,
  );
  const pageSize = config.allowedPageSizes.includes(rawL) ? rawL : config.defaultPageSize;
  return { page, pageSize };
}

export function buildListPaginationQueryString(
  page: number,
  pageSize: number,
  config: ListPaginationConfig = LUMA_ACCOUNT_LIST_PAGINATION,
): string {
  const sp = new URLSearchParams();
  sp.set(config.pageParam, String(page));
  sp.set(config.pageSizeParam, String(pageSize));
  return sp.toString();
}

/** `pathname` + query from config (only pagination params). Preserve other params in `getPageHref` yourself. */
export function createPathnamePageHref(
  pathname: string,
  config: ListPaginationConfig = LUMA_ACCOUNT_LIST_PAGINATION,
): (page: number, pageSize: number) => string {
  return (page, pageSize) => `${pathname}?${buildListPaginationQueryString(page, pageSize, config)}`;
}

export function totalPagesFor(totalCount: number, pageSize: number): number {
  if (totalCount <= 0 || pageSize <= 0) return 0;
  return Math.ceil(totalCount / pageSize);
}

export function listToolbarAmountLabel(
  totalCount: number,
  currentPage: number,
  pageSize: number,
): string {
  if (totalCount <= 0) return "0 items";
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);
  return `Items ${from} to ${to} of ${totalCount} total`;
}
