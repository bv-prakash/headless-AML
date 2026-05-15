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

export function refreshAfterStoreViewChange(
  router: RouterLike,
  options: { redirectTo?: string } = {},
): void {
  if (options.redirectTo) {
    router.push(options.redirectTo);
  } else {
    router.refresh();
  }
  void apolloClient.resetStore().catch(() => {});
}
