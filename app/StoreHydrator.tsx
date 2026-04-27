"use client";

import { useEffect, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { store } from "@/src/store/store";
import { hydrateAuth } from "@/src/store/slices/authSlice";
import { hydrateCompare } from "@/src/store/slices/compareSlice";
import { hydrateCart } from "@/src/store/slices/cartSlice";
import { hydrateWishlist } from "@/src/store/slices/wishlistSlice";
import { hydrateStoreView } from "@/src/store/slices/storeViewSlice";
import { writeStoreViewCookie } from "@/src/framework/store/storeViewCookie";
import { setAppLanguage } from "@/src/config/language";
import { getLanguageCodeForStoreView } from "@/src/config/storeViews";
import GuestCartPrefetch from "@/src/components/cart/GuestCartPrefetch";

/**
 * Separate hydration component to allow better code splitting
 * and prevent blocking the initial render
 */
export function StoreHydrator({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    store.dispatch(hydrateAuth());
    store.dispatch(hydrateCompare());
    store.dispatch(hydrateCart());
    store.dispatch(hydrateWishlist());
    store.dispatch(hydrateStoreView());
    const code = store.getState().storeView.code;
    writeStoreViewCookie(code);
    setAppLanguage(getLanguageCodeForStoreView(code));
    const ssrCode = document.documentElement.dataset.storeView?.trim() ?? "";
    if (ssrCode && ssrCode !== code) {
      /** Low-priority refresh; avoids blocking urgent UI work after hydration. */
      startTransition(() => {
        router.refresh();
      });
    }
  }, [router, startTransition]);

  return (
    <>
      <GuestCartPrefetch />
      {children}
    </>
  );
}
