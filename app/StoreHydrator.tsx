"use client";

import { useEffect, type ReactNode } from "react";
import { store } from "@/src/store/store";
import { hydrateAuth } from "@/src/store/slices/authSlice";
import { hydrateCompare } from "@/src/store/slices/compareSlice";
import { hydrateCart } from "@/src/store/slices/cartSlice";
import { hydrateWishlist } from "@/src/store/slices/wishlistSlice";
import GuestCartPrefetch from "@/src/components/cart/GuestCartPrefetch";

/**
 * Separate hydration component to allow better code splitting
 * and prevent blocking the initial render
 */
export function StoreHydrator({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Hydrate all store slices
    store.dispatch(hydrateAuth());
    store.dispatch(hydrateCompare());
    store.dispatch(hydrateCart());
    store.dispatch(hydrateWishlist());
  }, []);

  return (
    <>
      <GuestCartPrefetch />
      {children}
    </>
  );
}
