/**
 * CSS custom property names written by {@link applyStoreViewThemeToRoot} from
 * {@link StoreViewTheme} (`themes/base.theme.ts` + `themes/store-overrides.ts`).
 *
 * | TypeScript path              | CSS variable               | Tailwind (after @theme in globals.css) |
 * |-----------------------------|----------------------------|----------------------------------------|
 * | `theme.colors.headerBg`      | `--theme-header-bg`        | `bg-theme-header-bg`, `text-theme-header-bg`, … |
 * | `theme.colors.headerFg`      | `--theme-header-fg`        | `text-theme-header-fg`, …            |
 * | `theme.colors.headerBorder`  | `--theme-header-border`  | `border-theme-header-border`, …      |
 * | `theme.colors.bodyBg`        | `--theme-body-bg`          | `bg-theme-body-bg`, …                 |
 * | `theme.colors.surface`     | `--theme-surface`          | `bg-theme-surface`, …                 |
 * | `theme.colors.themePrimary`   | `--theme-themePrimary`     | via `@theme` → `text-theme-primary`, …       |
 * | `theme.colors.themeSecondary` | `--theme-themeSecondary`   | `text-theme-secondary`, `bg-theme-secondary` … |
 * | `theme.colors.themeTextColor` | `--theme-themeTextColor`   | `text-theme-text-color` …                    |
 * | `theme.brand.primary`        | `--color-theme-primary`    | also set for brand accents (may match primary) |
 * | `theme.fonts.body`           | `--store-font-body`        | `font-[family-name:var(--store-font-body)]` |
 * | `theme.fonts.heading`        | `--store-font-heading`     | same pattern for headings              |
 *
 * In **globals.css**, reference variables directly: `color: var(--theme-header-fg);`
 * Do **not** duplicate hex values from TS here — keep fallbacks in `:root` aligned with `base.theme.ts`.
 */
export const THEME_CSS_VARS = {
  headerBg: "--theme-header-bg",
  headerFg: "--theme-header-fg",
  headerBorder: "--theme-header-border",
  bodyBg: "--theme-body-bg",
  surface: "--theme-surface",
  themePrimary: "--theme-themePrimary",
  themeSecondary: "--theme-themeSecondary",
  themeTextColor: "--theme-themeTextColor",
  fontBody: "--store-font-body",
  fontHeading: "--store-font-heading",
  brandPrimary: "--color-theme-primary",
} as const;
