"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { LANGUAGE_CODE_KEY, STORE_VIEW_CODE_KEY } from "@/src/constants/storageKeys";
import {
  STORE_VIEW_COOKIE_NAME,
  getLanguageCodeForStoreView,
  getLanguageOptionsForStoreView,
  resolveStoreViewCodeForClientSources,
} from "@/src/config/storeViews";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CHANGE_EVENT,
  getTranslation as getTranslationByLanguage,
  resolveLanguageCode,
  type LanguageCode,
} from "@/src/i18n/commonLabels";
import { getStoredValue, setStoredValue } from "@/src/utils/storage";

const LANGUAGE_DIRECTIONS: Record<LanguageCode, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

function readClientStoreViewCode(): string {
  if (typeof document === "undefined") return "";
  let fromCookie: string | null = null;
  const parts = document.cookie.split("; ");
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i === -1) continue;
    if (p.slice(0, i).trim() === STORE_VIEW_COOKIE_NAME) {
      fromCookie = decodeURIComponent(p.slice(i + 1).trim());
      break;
    }
  }
  return resolveStoreViewCodeForClientSources(
    fromCookie,
    getStoredValue(STORE_VIEW_CODE_KEY),
  );
}

function readLanguageCode(): LanguageCode {
  if (typeof document === "undefined") return DEFAULT_LANGUAGE;
  const fromDom = resolveLanguageCode(
    document.documentElement.lang ?? DEFAULT_LANGUAGE,
  );
  const activeStoreViewCode = readClientStoreViewCode();
  const scopedLanguages = getLanguageOptionsForStoreView(activeStoreViewCode);
  const fromStoreView = getLanguageCodeForStoreView(activeStoreViewCode);
  const isStoreLanguageAvailable = scopedLanguages.some(
    (opt) => opt.languageCode === fromStoreView,
  );
  return isStoreLanguageAvailable ? fromStoreView : fromDom;
}

function emitLanguageChange(code: LanguageCode): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { code } }),
  );
}

function applyLanguage(code: LanguageCode): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = code;
  document.documentElement.dir = LANGUAGE_DIRECTIONS[code];
}

export function setAppLanguage(nextCode: string): LanguageCode {
  const code = resolveLanguageCode(nextCode);
  setStoredValue(LANGUAGE_CODE_KEY, code);
  applyLanguage(code);
  emitLanguageChange(code);
  return code;
}

export function useAppLanguage(): LanguageCode {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
      return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
    },
    readLanguageCode,
    () => DEFAULT_LANGUAGE,
  );
}

export function useLanguageTranslation(): {
  language: LanguageCode;
  getTranslation: (text: string) => string;
} {
  const language = useAppLanguage();
  const getTranslation = useCallback(
    (text: string) => getTranslationByLanguage(language, text),
    [language],
  );

  return useMemo(
    () => ({
      language,
      getTranslation,
    }),
    [getTranslation, language],
  );
}
