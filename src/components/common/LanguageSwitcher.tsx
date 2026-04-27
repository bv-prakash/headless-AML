"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setAppLanguage, useLanguageTranslation } from "@/src/config/language";
import { getLanguageOptionsForStoreView } from "@/src/config/storeViews";
import apolloClient from "@/src/framework/graphql/apolloClient";
import { writeStoreViewCookie } from "@/src/framework/store/storeViewCookie";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { selectStoreViewCode } from "@/src/store/selectors";
import { setStoreViewCode } from "@/src/store/slices/storeViewSlice";

export default function LanguageSwitcher() {
  const { language: code, getTranslation } = useLanguageTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const storeViewCode = useAppSelector(selectStoreViewCode);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => detailsRef.current?.removeAttribute("open");
    const onPointerDown = (e: PointerEvent) => {
      if (!detailsRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const languageOptions = useMemo(
    () => getLanguageOptionsForStoreView(storeViewCode),
    [storeViewCode],
  );
  const current = useMemo(
    () =>
      languageOptions.find((opt) => opt.storeViewCode === storeViewCode) ??
      languageOptions.find((opt) => opt.languageCode === code) ??
      languageOptions[0],
    [code, languageOptions, storeViewCode],
  );
  const languageLabel = getTranslation("Language");
  const langShortLabel = getTranslation("Lang");
  const chooseLanguageLabel = getTranslation("Choose language");

  const onChange = (nextStoreViewCode: string, nextCode: string) => {
    detailsRef.current?.removeAttribute("open");
    const storeChanged = nextStoreViewCode !== storeViewCode;
    if (storeChanged) {
      writeStoreViewCookie(nextStoreViewCode);
      dispatch(setStoreViewCode(nextStoreViewCode));
    }
    setAppLanguage(nextCode);
    if (storeChanged) {
      void apolloClient
        .resetStore()
        .catch(() => {})
        .finally(() => {
          router.refresh();
        });
    }
  };

  if (languageOptions.length < 2) return null;

  return (
    <details
      ref={detailsRef}
      className="relative shrink-0 group z-50"
      onToggle={(e) => setMenuOpen(e.currentTarget.open)}
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded border border-theme-header-border px-2.5 py-1.5 text-xs bg-white text-black shadow-sm opacity-95 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary [&::-webkit-details-marker]:hidden"
        aria-label={languageLabel}
      >
        <span className="hidden font-semibold sm:inline">{langShortLabel}</span>
        <span className="max-w-[100px] truncate">
          {current?.languageLabel ?? "English"}
        </span>
        <i
          className="icon-back-arrow text-sm leading-none before:font-bold transition-transform -rotate-90 opacity-70"
          aria-hidden
        />
      </summary>
      <ul
        className="absolute right-0 mt-1 min-w-[180px] overflow-auto rounded border border-aaa bg-white py-1 shadow-lg"
        role="listbox"
        aria-label={chooseLanguageLabel}
      >
        {languageOptions.map((option) => (
          <li key={option.storeViewCode} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={option.storeViewCode === storeViewCode}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-f0f0f0 ${
                option.storeViewCode === storeViewCode
                  ? "bg-f0f0f0 font-semibold text-black"
                  : "text-gray-800"
              }`}
              onClick={() =>
                onChange(option.storeViewCode, option.languageCode)
              }
            >
              <span>{option.languageLabel}</span>
              <span className="text-[11px] text-gray-600">
                {option.nativeLanguageLabel}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
