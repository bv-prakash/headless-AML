import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export const selectIsLoggedIn = (state: RootState) => Boolean(state.auth.token);

export const selectAuthHydrated = (state: RootState) => state.auth.hydrated;

export const selectAuthSessionRevision = (state: RootState) =>
  state.auth.sessionRevision;

export const selectStoreViewCode = (state: RootState) => state.storeView.code;

export const selectStoreViewRevision = (state: RootState) => state.storeView.revision;

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
