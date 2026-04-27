/**
 * Store-view theming: tokens, CSS variables, per-store overrides, component flags.
 *
 * - Edit themes: `themes/base.theme.ts`, `themes/store-overrides.ts`
 * - Tailwind (see `app/globals.css` @theme): `bg-theme-header-bg`, `text-theme-header-fg`,
 *   `border-theme-header-border`, `bg-theme-body-bg`, `bg-theme-surface`, `text-theme-primary`, …
 * - Raw CSS: `var(--theme-header-bg)` etc. — names in `THEME_CSS_VARS`
 * - Optional chrome: `<StoreViewConditional feature="compareIcon">…</StoreViewConditional>`
 */
export type {
  StoreViewTheme,
  StoreViewThemeColors,
  StoreViewThemeFonts,
  StoreViewThemeBrand,
  StoreViewUiComponentKey,
} from "@/src/theme/store-view/types";
export { STORE_VIEW_UI_COMPONENTS } from "@/src/theme/store-view/types";
export { THEME_CSS_VARS } from "@/src/theme/store-view/css-variable-names";
export { BASE_STORE_VIEW_THEME } from "@/src/theme/store-view/themes/base.theme";
export { STORE_VIEW_THEME_OVERRIDES } from "@/src/theme/store-view/themes/store-overrides";
export {
  resolveStoreViewTheme,
  isStoreComponentEnabled,
  listComponentFlags,
} from "@/src/theme/store-view/resolveStoreViewTheme";
export {
  applyStoreViewThemeToRoot,
  storeViewThemeToHtmlStyle,
} from "@/src/theme/store-view/applyThemeToRoot";
export { StoreViewConditional } from "@/src/theme/store-view/StoreViewConditional";
