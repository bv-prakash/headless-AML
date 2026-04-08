import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export const selectIsLoggedIn = (state: RootState) => Boolean(state.auth.token);

export const selectCartBadgeCount = (state: RootState) => state.cart.totalQuantity;

export const selectMinicartProps = createSelector(
  (state: RootState) => state.cart.open,
  (state: RootState) => state.cart.cartId,
  (state: RootState) => state.cart.cart,
  (state: RootState) => state.cart.totalQuantity,
  (open, cartId, cart, totalQuantity) => ({ open, cartId, cart, totalQuantity }),
);

export const selectCartPageProps = createSelector(
  (state: RootState) => state.cart.cartId,
  (state: RootState) => state.cart.cart,
  (state: RootState) => state.cart.hydrated,
  (cartId, cart, hydrated) => ({ cartId, cart, hydrated }),
);
