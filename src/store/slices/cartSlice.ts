import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { CART_ID_KEY, CART_COUNT_KEY } from "@/src/constants/storageKeys";
import { getStoredValue, setStoredValue, removeStoredValue } from "@/src/utils/storage";
import type { CartData } from "@/src/framework/graphql/mutations/cartMutations";

type CartState = {
  cartId: string | null;
  totalQuantity: number;
  cart: CartData | null;
  open: boolean;
  hydrated: boolean;
};

const initialState: CartState = {
  cartId: null,
  totalQuantity: 0,
  cart: null,
  open: false,
  hydrated: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartId(state, action: PayloadAction<string>) {
      state.cartId = action.payload;
      setStoredValue(CART_ID_KEY, action.payload);
    },
    setCart(state, action: PayloadAction<CartData>) {
      state.cart = action.payload;
      state.totalQuantity = action.payload.total_quantity;
      setStoredValue(CART_COUNT_KEY, String(action.payload.total_quantity));
    },
    setCartCount(state, action: PayloadAction<number>) {
      state.totalQuantity = action.payload;
      setStoredValue(CART_COUNT_KEY, String(action.payload));
    },
    openMinicart(state) {
      state.open = true;
    },
    closeMinicart(state) {
      state.open = false;
    },
    clearCart(state) {
      state.cartId = null;
      state.totalQuantity = 0;
      state.cart = null;
      state.open = false;
      removeStoredValue(CART_ID_KEY);
      removeStoredValue(CART_COUNT_KEY);
    },
    hydrateCart(state) {
      const cartId = getStoredValue(CART_ID_KEY);
      const count = parseInt(getStoredValue(CART_COUNT_KEY) ?? "0", 10);
      state.cartId = cartId;
      state.totalQuantity = isNaN(count) ? 0 : count;
      state.hydrated = true;
    },
  },
});

export const {
  setCartId,
  setCart,
  setCartCount,
  openMinicart,
  closeMinicart,
  clearCart,
  hydrateCart,
} = cartSlice.actions;
export default cartSlice.reducer;
