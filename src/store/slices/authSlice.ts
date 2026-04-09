import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { CUSTOMER_TOKEN_KEY } from "@/src/constants/storageKeys";
import {
  getStoredValue,
  setStoredValue,
  removeStoredValue,
} from "@/src/utils/storage";

export type CustomerInfo = {
  readonly firstname: string;
  readonly lastname: string;
  readonly email: string;
};

type AuthState = {
  token: string | null;
  customer: CustomerInfo | null;
  isLoggedIn: boolean;
  /** True after `hydrateAuth` runs (client) — avoids redirect flashes before token is read from storage. */
  hydrated: boolean;
  /**
   * Bumps on explicit `login` / `logout` only (not `hydrateAuth`) so client UI like PageBuilder
   * Swiper can remount after auth transitions without a full reload.
   */
  sessionRevision: number;
};

const initialState: AuthState = {
  token: null,
  customer: null,
  isLoggedIn: false,
  hydrated: false,
  sessionRevision: 0,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(
      state,
      action: PayloadAction<{ token: string; customer?: CustomerInfo }>,
    ) {
      state.token = action.payload.token;
      state.customer = action.payload.customer ?? null;
      state.isLoggedIn = true;
      state.sessionRevision += 1;
      setStoredValue(CUSTOMER_TOKEN_KEY, action.payload.token);
    },
    logout(state) {
      state.token = null;
      state.customer = null;
      state.isLoggedIn = false;
      state.sessionRevision += 1;
      removeStoredValue(CUSTOMER_TOKEN_KEY);
    },
    hydrateAuth(state) {
      const token = getStoredValue(CUSTOMER_TOKEN_KEY);
      state.token = token;
      state.isLoggedIn = Boolean(token);
      state.hydrated = true;
      if (!token) {
        state.customer = null;
      }
    },
  },
});

export const { login, logout, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;
