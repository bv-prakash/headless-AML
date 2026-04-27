import type { CSSProperties } from "react";
import type { StoreViewTheme } from "@/src/theme/store-view/types";
import { THEME_CSS_VARS } from "@/src/theme/store-view/css-variable-names";

/** Apply all theme tokens to a root element (typically `document.documentElement`). */
export function applyStoreViewThemeToRoot(root: HTMLElement, theme: StoreViewTheme): void {
  root.style.setProperty(THEME_CSS_VARS.headerBg, theme.colors.headerBg);
  root.style.setProperty(THEME_CSS_VARS.headerFg, theme.colors.headerFg);
  root.style.setProperty(THEME_CSS_VARS.headerBorder, theme.colors.headerBorder);
  root.style.setProperty(THEME_CSS_VARS.bodyBg, theme.colors.bodyBg);
  root.style.setProperty(THEME_CSS_VARS.surface, theme.colors.surface);
  root.style.setProperty(THEME_CSS_VARS.themePrimary, theme.colors.themePrimary);
  root.style.setProperty(THEME_CSS_VARS.themeSecondary, theme.colors.themeSecondary);
  root.style.setProperty(THEME_CSS_VARS.themeTextColor, theme.colors.themeTextColor);
  root.style.setProperty(THEME_CSS_VARS.fontBody, theme.fonts.body);
  root.style.setProperty(THEME_CSS_VARS.fontHeading, theme.fonts.heading);
  root.style.setProperty(THEME_CSS_VARS.brandPrimary, theme.brand.primary);
}

/** Inline style object for `<html>` SSR (same tokens as {@link applyStoreViewThemeToRoot}). */
export function storeViewThemeToHtmlStyle(theme: StoreViewTheme): CSSProperties {
  return {
    [THEME_CSS_VARS.headerBg]: theme.colors.headerBg,
    [THEME_CSS_VARS.headerFg]: theme.colors.headerFg,
    [THEME_CSS_VARS.headerBorder]: theme.colors.headerBorder,
    [THEME_CSS_VARS.bodyBg]: theme.colors.bodyBg,
    [THEME_CSS_VARS.surface]: theme.colors.surface,
    [THEME_CSS_VARS.themePrimary]: theme.colors.themePrimary,
    [THEME_CSS_VARS.themeSecondary]: theme.colors.themeSecondary,
    [THEME_CSS_VARS.themeTextColor]: theme.colors.themeTextColor,
    [THEME_CSS_VARS.fontBody]: theme.fonts.body,
    [THEME_CSS_VARS.fontHeading]: theme.fonts.heading,
    [THEME_CSS_VARS.brandPrimary]: theme.brand.primary,
  } as CSSProperties;
}
