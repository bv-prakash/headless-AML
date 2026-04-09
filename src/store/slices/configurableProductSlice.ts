import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearCart, setCart } from "@/src/store/slices/cartSlice";

/**
 * Global configurable PDP state keyed by product `url_key` (matches cart `product.url_key`).
 * Updated on every `setCart` from configurable lines; updated when swatches change on PDP.
 */
export type ConfigurableProductRow = {
  readonly variantSku: string;
  readonly optionLabels: readonly { option_label: string; value_label: string }[];
  /** attribute_code → value_index; null = derive from labels / variant SKU on PDP. */
  optionSelections: Record<string, number> | null;
};

type ConfigurableProductState = {
  readonly byUrlKey: Record<string, ConfigurableProductRow>;
};

const initialState: ConfigurableProductState = { byUrlKey: {} };

const configurableProductSlice = createSlice({
  name: "configurableProduct",
  initialState,
  reducers: {
    updateConfigurableSelections(
      state,
      action: PayloadAction<{
        urlKey: string;
        variantSku: string;
        selections: Record<string, number>;
      }>,
    ) {
      const { urlKey, variantSku, selections } = action.payload;
      const prev = state.byUrlKey[urlKey];
      state.byUrlKey[urlKey] = {
        variantSku,
        optionLabels: prev?.optionLabels ?? [],
        optionSelections: selections,
      };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setCart, (state, action) => {
      const cart = action.payload;
      /** Upsert only — do not delete keys for products not in cart so PDP selections survive cart refresh / line removal. */
      for (const item of cart.items) {
        const product = item.product;
        if (!product?.url_key) continue;
        const co = item.configurable_options;
        if (!co?.length) continue;
        const urlKey = product.url_key;
        state.byUrlKey[urlKey] = {
          variantSku: product.sku,
          optionLabels: co.map((o) => ({
            option_label: o.option_label,
            value_label: o.value_label,
          })),
          optionSelections: null,
        };
      }
    });
    builder.addCase(clearCart, () => initialState);
  },
});

export const { updateConfigurableSelections } = configurableProductSlice.actions;
export default configurableProductSlice.reducer;
