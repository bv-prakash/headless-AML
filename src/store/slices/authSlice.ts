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
};

const initialState: AuthState = {
  token: null,
  customer: null,
  isLoggedIn: false,
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
      setStoredValue(CUSTOMER_TOKEN_KEY, action.payload.token);
    },
    logout(state) {
      state.token = null;
      state.customer = null;
      state.isLoggedIn = false;
      removeStoredValue(CUSTOMER_TOKEN_KEY);
    },
    hydrateAuth(state) {
      const token = getStoredValue(CUSTOMER_TOKEN_KEY);
      state.token = token;
      state.isLoggedIn = Boolean(token);
      if (!token) {
        state.customer = null;
      }
    },
  },
});

export const { login, logout, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;
