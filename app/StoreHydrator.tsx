"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { store } from "@/src/store/store";
import { hydrateAuth } from "@/src/store/slices/authSlice";
import { hydrateCompare } from "@/src/store/slices/compareSlice";
import { hydrateCart } from "@/src/store/slices/cartSlice";
import { hydrateWishlist } from "@/src/store/slices/wishlistSlice";
import { hydrateStoreView } from "@/src/store/slices/storeViewSlice";
import { writeStoreViewCookie } from "@/src/framework/store/storeViewCookie";
import { setAppLanguage } from "@/src/config/language";
import {
  getLanguageCodeForStoreView,
} from "@/src/config/storeViews";
import {
  CUSTOMER_SESSION_INVALID_MESSAGE,
  SESSION_EXPIRED_TOAST_KEY,
} from "@/src/framework/graphql/invalidateCustomerSession";
import GuestCartPrefetch from "@/src/components/cart/GuestCartPrefetch";
import PageLoader from "@/src/components/common/PageLoader";

/**
 * Separate hydration component to allow better code splitting
 * and prevent blocking the initial render
 */
export function StoreHydrator({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
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
      try {
        const shouldShowSessionExpired =
          sessionStorage.getItem(SESSION_EXPIRED_TOAST_KEY) === "1";
        if (shouldShowSessionExpired) {
          sessionStorage.removeItem(SESSION_EXPIRED_TOAST_KEY);
          toast.error(CUSTOMER_SESSION_INVALID_MESSAGE);
        }
      } catch {}
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, startTransition]);

  if (!hydrated) {
    return <PageLoader fullScreen label="Loading store..." />;
  }

  return (
    <>
      <GuestCartPrefetch />
      {children}
    </>
  );
}
