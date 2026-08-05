import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import compareReducer from "./slices/compareSlice";
import wishlistReducer from "./slices/wishlistSlice";
import cartReducer from "./slices/cartSlice";
import configurableProductReducer from "./slices/configurableProductSlice";
import storeViewReducer from "./slices/storeViewSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    compare: compareReducer,
    wishlist: wishlistReducer,
    cart: cartReducer,
    configurableProduct: configurableProductReducer,
    storeView: storeViewReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
