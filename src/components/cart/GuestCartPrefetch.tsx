"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/src/store/hooks";
import { setCartId } from "@/src/store/slices/cartSlice";
import { CART_ID_KEY } from "@/src/constants/storageKeys";
import { getStoredValue } from "@/src/utils/storage";
import { ensureGuestCartId } from "@/src/framework/cart/ensureGuestCart";

/**
 * Creates a masked cart in the background after hydration when none exists,
 * so the first “Add to cart” usually only runs the add mutation (not createEmptyCart + add).
 */
export default function GuestCartPrefetch() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (getStoredValue(CART_ID_KEY)) return;

    let cancelled = false;
    void ensureGuestCartId().then((id) => {
      if (!cancelled && id) dispatch(setCartId(id));
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
}
