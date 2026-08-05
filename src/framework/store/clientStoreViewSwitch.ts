"use client";

import type { AppDispatch } from "@/src/store/store";
import { setAppLanguage } from "@/src/config/language";
import { getLanguageCodeForStoreView } from "@/src/config/storeViews";
import apolloClient from "@/src/framework/graphql/apolloClient";
import { writeStoreViewCookie } from "@/src/framework/store/storeViewCookie";
import { setStoreViewCode } from "@/src/store/slices/storeViewSlice";

type RouterLike = {
  refresh: () => void;
  push: (href: string) => void;
};

type ApplyClientStoreViewOptions = {
  readonly dispatch: AppDispatch;
  readonly nextStoreViewCode: string;
  readonly currentStoreViewCode: string;
  readonly nextLanguageCode?: string;
};

export function applyClientStoreViewState({
  dispatch,
  nextStoreViewCode,
  currentStoreViewCode,
  nextLanguageCode,
}: ApplyClientStoreViewOptions): boolean {
  const storeChanged = nextStoreViewCode !== currentStoreViewCode;
  if (!storeChanged) return false;

  writeStoreViewCookie(nextStoreViewCode);
  dispatch(setStoreViewCode(nextStoreViewCode));
  setAppLanguage(nextLanguageCode ?? getLanguageCodeForStoreView(nextStoreViewCode));
  return true;
}

/**
 * Two navigation modes:
 *  - **Soft refresh** (no `redirectTo`): same route, re-fetch RSC with the new
 *    `magento_store_view` cookie so Header/Footer/CMS render against the new store.
 *  - **Hard navigation** (with `redirectTo`): used by the cross-website signed-in
 *    switch. Next.js's Client Router Cache keeps the root layout (Header/Logo/Footer)
 *    and any prefetched RSC for the destination, so a plain `router.push` would
 *    render the new URL with the *previous* store's Header/CMS. A full page load
 *    re-issues every request with the new cookie and rebuilds Apollo/Magento server
 *    caches from scratch — which is exactly what we want when the customer is
 *    being signed out of one website and signed into another.
 */
export function refreshAfterStoreViewChange(
  router: RouterLike,
  options: { redirectTo?: string } = {},
): void {
  if (options.redirectTo) {
    if (typeof window !== "undefined") {
      window.location.assign(options.redirectTo);
      return;
    }
    router.push(options.redirectTo);
    router.refresh();
  } else {
    router.refresh();
  }
  void apolloClient.resetStore().catch(() => {});
}
