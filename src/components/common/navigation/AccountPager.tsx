"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ListPager, type ListPagerProps } from "@/src/components/common/navigation/ListPager";
import { createPathnamePageHref, LUMA_ACCOUNT_LIST_PAGINATION } from "@/src/utils/listPagination";

/** Same as {@link ListPagerProps} but omits `getPageHref` (uses current path + default `p` / `limit`). */
export type AccountPagerProps = Omit<ListPagerProps, "getPageHref">;

/**
 * Opinionated pager for My Account–style routes: `?p=&limit=` on the current pathname.
 * For other URL shapes or extra query params, use {@link ListPager} and pass `getPageHref` yourself.
 */
export function AccountPager(props: AccountPagerProps) {
  const pathname = usePathname();
  const getPageHref = useMemo(
    () => createPathnamePageHref(pathname, LUMA_ACCOUNT_LIST_PAGINATION),
    [pathname],
  );
  return <ListPager {...props} getPageHref={getPageHref} />;
}
