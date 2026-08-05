/**
 * Central store-view theme model. Values map to CSS variables on `<html>`
 * (see `css-variable-names.ts` + `applyThemeToRoot.ts`).
 */
export type StoreViewThemeColors = {
  readonly headerBg: string;
  readonly headerFg: string;
  /** Bottom / accent border under header (often matches brand primary). */
  readonly headerBorder: string;
  readonly bodyBg: string;
  readonly surface: string;
  readonly themePrimary: string;
  readonly themeSecondary: string;
  readonly themeTextColor: string;
};

export type StoreViewThemeFonts = {
  readonly body: string;
  readonly heading: string;
};

export type StoreViewThemeBrand = {
  /** Maps to `--color-theme-primary` for Tailwind `theme-primary` utilities. */
  readonly primary: string;
};

/**
 * Toggle chrome / marketing blocks per store without branching every page by hand.
 * Keys are stable IDs — add new keys here when you introduce optional UI.
 */
export const STORE_VIEW_UI_COMPONENTS = [
  "storeViewToggle",
  "compareIcon",
  "wishlistIcon",
  "cartIcon",
  "headerAuth",
  "categoryNav",
] as const;

export type StoreViewUiComponentKey = (typeof STORE_VIEW_UI_COMPONENTS)[number];

export type StoreViewThemeComponents = Partial<
  Record<StoreViewUiComponentKey, boolean>
>;

export type StoreViewTheme = {
  readonly colors: StoreViewThemeColors;
  readonly fonts: StoreViewThemeFonts;
  readonly brand: StoreViewThemeBrand;
  /** If omitted for a key, defaults to `true`. */
  readonly components?: StoreViewThemeComponents;
};
