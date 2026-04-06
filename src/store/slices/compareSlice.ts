import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { COMPARE_UID_KEY, COMPARE_COUNT_KEY } from "@/src/constants/storageKeys";
import {
  getStoredValue,
  setStoredValue,
  removeStoredValue,
} from "@/src/utils/storage";

type CompareState = {
  uid: string | null;
  itemCount: number;
  hydrated: boolean;
};

const initialState: CompareState = {
  uid: null,
  itemCount: 0,
  hydrated: false,
};

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    setCompareCount(state, action: PayloadAction<number>) {
      state.itemCount = action.payload;
      setStoredValue(COMPARE_COUNT_KEY, String(action.payload));
    },
    updateCompare(
      state,
      action: PayloadAction<{ uid: string; itemCount: number }>,
    ) {
      state.uid = action.payload.uid;
      state.itemCount = action.payload.itemCount;
      setStoredValue(COMPARE_UID_KEY, action.payload.uid);
      setStoredValue(COMPARE_COUNT_KEY, String(action.payload.itemCount));
    },
    clearCompare(state) {
      state.uid = null;
      state.itemCount = 0;
      removeStoredValue(COMPARE_UID_KEY);
      removeStoredValue(COMPARE_COUNT_KEY);
    },
    hydrateCompare(state) {
      const uid = getStoredValue(COMPARE_UID_KEY);
      const count = parseInt(getStoredValue(COMPARE_COUNT_KEY) ?? "0", 10);
      state.uid = uid;
      state.itemCount = isNaN(count) ? 0 : count;
      state.hydrated = true;
    },
  },
});

export const {
  setCompareCount,
  updateCompare,
  clearCompare,
  hydrateCompare,
} = compareSlice.actions;
export default compareSlice.reducer;
