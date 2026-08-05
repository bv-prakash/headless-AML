import type { StoreViewTheme } from "@/src/theme/store-view/types";

/** Default (American Lighting / `default` store view) — light header, Proxima stack. */
export const BASE_STORE_VIEW_THEME: StoreViewTheme = {
  colors: {
    headerBg: "#ffffff",
    headerFg: "#000000",
    headerBorder: "#384c60",
    bodyBg: "#ffffff",
    surface: "#ffffff",
    themePrimary: "#384c60",
    themeSecondary: "#002941",
    themeTextColor: "#000",
  },
  fonts: {
    body: `"proxima-nova", ui-sans-serif, system-ui, sans-serif`,
    heading: `"proxima-nova", ui-sans-serif, system-ui, sans-serif`,
  },
  brand: {
    primary: "#384c60",
  },
  components: {
    storeViewToggle: true,
    compareIcon: true,
    wishlistIcon: true,
    cartIcon: true,
    headerAuth: true,
    categoryNav: true,
  },
};
