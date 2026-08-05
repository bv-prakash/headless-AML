import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { WISHLIST_COUNT_KEY } from "@/src/constants/storageKeys";
import {
  getScopedStoredValue,
  setScopedStoredValue,
  removeScopedStoredValue,
} from "@/src/utils/storage";

type WishlistState = {
  itemCount: number;
};

const initialState: WishlistState = {
  itemCount: 0,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlistCount(state, action: PayloadAction<number>) {
      state.itemCount = action.payload;
      setScopedStoredValue(WISHLIST_COUNT_KEY, String(action.payload));
    },
    clearWishlist(state) {
      state.itemCount = 0;
      removeScopedStoredValue(WISHLIST_COUNT_KEY);
    },
    hydrateWishlist(state) {
      const count = parseInt(
        getScopedStoredValue(WISHLIST_COUNT_KEY) ?? "0",
        10,
      );
      state.itemCount = isNaN(count) ? 0 : count;
    },
  },
});

export const { setWishlistCount, clearWishlist, hydrateWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
