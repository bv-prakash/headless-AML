import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { WISHLIST_COUNT_KEY } from "@/src/constants/storageKeys";
import { getStoredValue, setStoredValue, removeStoredValue } from "@/src/utils/storage";

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
      setStoredValue(WISHLIST_COUNT_KEY, String(action.payload));
    },
    clearWishlist(state) {
      state.itemCount = 0;
      removeStoredValue(WISHLIST_COUNT_KEY);
    },
    hydrateWishlist(state) {
      const count = parseInt(getStoredValue(WISHLIST_COUNT_KEY) ?? "0", 10);
      state.itemCount = isNaN(count) ? 0 : count;
    },
  },
});

export const { setWishlistCount, clearWishlist, hydrateWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
