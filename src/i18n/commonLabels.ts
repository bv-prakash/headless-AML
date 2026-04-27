import enCommon from "@/public/locales/en/common.json";
import arCommon from "@/public/locales/ar/common.json";

type CommonLabels = Record<string, string>;

const COMMON_BY_LANGUAGE = {
  en: enCommon as CommonLabels,
  ar: arCommon as CommonLabels,
} as const;

export type LanguageCode = keyof typeof COMMON_BY_LANGUAGE;
export const DEFAULT_LANGUAGE: LanguageCode = "en";
export const LANGUAGE_CHANGE_EVENT = "app-language-change";

function hasLanguage(code: string): code is LanguageCode {
  return code in COMMON_BY_LANGUAGE;
}

export function resolveLanguageCode(value: string | null | undefined): LanguageCode {
  const normalized = (value ?? "").trim().toLowerCase();
  if (hasLanguage(normalized)) return normalized;
  return DEFAULT_LANGUAGE;
}

export function getCommonLabels(language: LanguageCode): CommonLabels {
  return COMMON_BY_LANGUAGE[resolveLanguageCode(language)] ?? COMMON_BY_LANGUAGE[DEFAULT_LANGUAGE];
}

export function getCommonLabel(
  language: LanguageCode,
  key: string,
  fallback?: string,
): string {
  const labels = getCommonLabels(language);
  return labels[key] ?? fallback ?? key;
}

export function getTranslation(language: LanguageCode, text: string): string {
  const labels = getCommonLabels(language);
  return labels[text] ?? text;
}

export function resolveLanguageFromDocument(): LanguageCode {
  if (typeof document === "undefined") return DEFAULT_LANGUAGE;
  return resolveLanguageCode(document.documentElement.lang);
}
