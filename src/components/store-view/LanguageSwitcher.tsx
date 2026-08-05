"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguageTranslation } from "@/src/config/language";
import {
  getLanguageOptionsForStoreView,
  hydrateStoreViewOptionsFromMagento,
} from "@/src/config/storeViews";
import {
  applyClientStoreViewState,
  refreshAfterStoreViewChange,
} from "@/src/framework/store/clientStoreViewSwitch";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { selectStoreViewCode } from "@/src/store/selectors";

export default function LanguageSwitcher() {
  const { language: code, getTranslation } = useLanguageTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const storeViewCode = useAppSelector(selectStoreViewCode);
  const [storeViewsRevision, setStoreViewsRevision] = useState(0);

  useEffect(() => {
    void hydrateStoreViewOptionsFromMagento().then(() => {
      setStoreViewsRevision((prev) => prev + 1);
    });
  }, []);

  const languageOptions = useMemo(
    () => getLanguageOptionsForStoreView(storeViewCode),
    [storeViewCode, storeViewsRevision],
  );
  const current = useMemo(
    () =>
      languageOptions.find((opt) => opt.storeViewCode === storeViewCode) ??
      languageOptions.find((opt) => opt.languageCode === code) ??
      languageOptions[0],
    [code, languageOptions, storeViewCode],
  );

  const onChange = (nextStoreViewCode: string, nextCode: string) => {
    const storeChanged = applyClientStoreViewState({
      dispatch,
      nextStoreViewCode,
      currentStoreViewCode: storeViewCode,
      nextLanguageCode: nextCode,
    });
    if (storeChanged) {
      refreshAfterStoreViewChange(router);
    }
  };

  if (languageOptions.length < 2) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 h-9 items-center gap-2 rounded-full border border-theme-header-border bg-white p-1 text-[11px] font-semibold text-gray-700 shadow-sm">
        {languageOptions.map((option, index) => {
          const active = option.storeViewCode === current?.storeViewCode;
          return (
            <button
              key={option.storeViewCode}
              type="button"
              aria-pressed={active}
              className={`relative z-10 min-w-[72px] rounded-full px-3 py-1 transition cursor-pointer ${
                active
                  ? "bg-theme-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => onChange(option.storeViewCode, option.languageCode)}
            >
              {option.languageLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
