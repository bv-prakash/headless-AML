import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { STORE_VIEW_CODE_KEY } from "@/src/constants/storageKeys";
import {
  getDefaultStoreViewCodeFromEnv,
  normalizeStoreViewCode,
  normalizeStoreViewCodeLoose,
} from "@/src/config/storeViews";
import { resolveClientStoreViewCode } from "@/src/framework/store/resolveClientStoreViewCode";
import { setStoredValue } from "@/src/utils/storage";

type StoreViewState = {
  code: string;
  hydrated: boolean;
  /** Incremented when the shopper changes store view (remount store-sensitive client UI). */
  revision: number;
};

const initialState: StoreViewState = {
  code: getDefaultStoreViewCodeFromEnv(),
  hydrated: false,
  revision: 0,
};

const storeViewSlice = createSlice({
  name: "storeView",
  initialState,
  reducers: {
    hydrateStoreView(state) {
      const code = resolveClientStoreViewCode();
      state.code = code;
      state.hydrated = true;
      setStoredValue(STORE_VIEW_CODE_KEY, code);
    },
    setStoreViewCode(state, action: PayloadAction<string>) {
      /**
       * During early boot, store options may not be hydrated yet, so strict normalization can
       * reject valid store codes. Fall back to loose normalization so multi-store switching
       * still works immediately; strict validation resumes automatically after hydration.
       */
      const next =
        normalizeStoreViewCode(action.payload) ??
        normalizeStoreViewCodeLoose(action.payload);
      if (!next) return;
      state.code = next;
      state.revision += 1;
      setStoredValue(STORE_VIEW_CODE_KEY, next);
    },
  },
});

export const { hydrateStoreView, setStoreViewCode } = storeViewSlice.actions;
export default storeViewSlice.reducer;
