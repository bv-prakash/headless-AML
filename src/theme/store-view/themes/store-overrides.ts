import type { StoreViewTheme } from "@/src/theme/store-view/types";

/** Same shape as StoreViewTheme but every field optional for overrides. */
export type RecursivePartial<T> = {
  readonly [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

/**
 * Partial themes keyed by Magento store view code. Deep-merged onto {@link BASE_STORE_VIEW_THEME}.
 * Edit here for per-store colors, fonts, or component visibility.
 */
export const STORE_VIEW_THEME_OVERRIDES: Readonly<
  Record<string, RecursivePartial<StoreViewTheme>>
> = {
  tinsl_lighting_store_view: {
    colors: {
      headerBg: "#0a0a0a",
      headerFg: "#f5f5f5",
      headerBorder: "#2f4f4f",
      bodyBg: "#fafafa",
      surface: "#ffffff",
      themePrimary: "#2c2d33",
      themeSecondary: "#18181b",
      themeTextColor: "#fff",
    },
    fonts: {
      body: `Georgia, "Times New Roman", serif`,
      heading: `Georgia, "Times New Roman", serif`,
    },
    brand: { primary: "#2f4f4f" },
  },
  proluxelighting_store_view: {
    colors: {
      headerBg: "#212322",
      headerFg: "#fff",
      headerBorder: "#1a365d",
      bodyBg: "#f8fafc",
      surface: "#ffffff",
      themePrimary: "#c6b682",
      themeSecondary: "#212322",
      themeTextColor: "#000",
    },
    fonts: {
      body: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`,
    },
    brand: { primary: "#1a365d" },
  },
  prizmlighting_store_view: {
    colors: {
      headerBg: "#fff",
      headerFg: "#000",
      headerBorder: "#000",
      bodyBg: "#000",
      surface: "#ffffff",
      themePrimary: "#000",
      themeSecondary: "#2b2b2b",
      themeTextColor: "#fff",
    },
    fonts: {
      heading: `ui-serif, Georgia, serif`,
    },
    brand: { primary: "#4a3728" },
  },
  brightluxlighting_store_view: {
    colors: {
      headerBg: "#fff",
      headerFg: "#000",
      headerBorder: "#000",
      bodyBg: "#f0fdf4",
      surface: "#ffffff",
      themePrimary: "#00263a",
      themeSecondary: "#005278",
      themeTextColor: "#00263a",
    },
    brand: { primary: "#0f3d3e" },
  },
};
