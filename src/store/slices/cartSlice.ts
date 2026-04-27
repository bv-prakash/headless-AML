import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { CART_ID_KEY, CART_COUNT_KEY } from "@/src/constants/storageKeys";
import {
  getScopedStoredValue,
  setScopedStoredValue,
  removeScopedStoredValue,
} from "@/src/utils/storage";
import type { CartData } from "@/src/framework/graphql/mutations/cartMutations";

type CartState = {
  cartId: string | null;
  totalQuantity: number;
  cart: CartData | null;
  open: boolean;
  hydrated: boolean;
  quantities: Record<string, number>;
};

const initialState: CartState = {
  cartId: null,
  totalQuantity: 0,
  cart: null,
  open: false,
  hydrated: false,
  quantities: {},
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartId(state, action: PayloadAction<string>) {
      state.cartId = action.payload;
      setScopedStoredValue(CART_ID_KEY, action.payload);
    },
    setCart(state, action: PayloadAction<CartData>) {
      const cart = action.payload;
      state.cart = cart as typeof state.cart;
      state.totalQuantity = cart.total_quantity;
      setScopedStoredValue(CART_COUNT_KEY, String(cart.total_quantity));
      const freshQuantities: Record<string, number> = {};
      const skuTotals: Record<string, number> = {};
      for (const item of cart.items) {
        const uidKey = `cart-${item.uid}`;
        freshQuantities[uidKey] = item.quantity;
        const psku = item.product?.sku;
        if (psku) {
          skuTotals[psku] = (skuTotals[psku] ?? 0) + item.quantity;
        }
      }
      for (const [sku, qty] of Object.entries(skuTotals)) {
        freshQuantities[sku] = qty;
      }
      state.quantities = freshQuantities;
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
      state.quantities = {};
      removeScopedStoredValue(CART_ID_KEY);
      removeScopedStoredValue(CART_COUNT_KEY);
    },
    hydrateCart(state) {
      const cartId = getScopedStoredValue(CART_ID_KEY);
      const count = parseInt(getScopedStoredValue(CART_COUNT_KEY) ?? "0", 10);
      state.cartId = cartId;
      state.totalQuantity = isNaN(count) ? 0 : count;
      state.hydrated = true;
    },
    setQuantity(state, action: PayloadAction<{ key: string; qty: number }>) {
      state.quantities[action.payload.key] = action.payload.qty;
    },
  },
});

export const {
  setCartId,
  setCart,
  openMinicart,
  closeMinicart,
  clearCart,
  hydrateCart,
  setQuantity,
} = cartSlice.actions;
export default cartSlice.reducer;
