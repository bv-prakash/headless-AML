"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguageTranslation } from "@/src/config/language";
import { getLanguageOptionsForStoreView } from "@/src/config/storeViews";
import { useAppSelector } from "@/src/store/hooks";
import { selectStoreViewCode } from "@/src/store/selectors";
import { isStoreComponentEnabled } from "@/src/theme/store-view";
import LanguageSwitcher from "./LanguageSwitcher";
import StoreViewToggle from "./StoreViewToggle";
import Image from "next/image";

export default function StoreLanguageToggleGroup({ className, imageSrc }: { className?: string; imageSrc: string }) {
  const storeViewCode = useAppSelector(selectStoreViewCode);
  const { language } = useLanguageTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const languageOptions = useMemo(
    () => getLanguageOptionsForStoreView(storeViewCode),
    [storeViewCode, language],
  );
  const showLanguage = languageOptions.length > 1;
  const showStoreView = isStoreComponentEnabled("storeViewToggle", storeViewCode);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!showLanguage && !showStoreView) {
    return null;
  }

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className} `}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-xs font-semibold text-black transition cursor-pointer"
      >
        <Image src={imageSrc} alt="Language" width={26} height={26} />
      </button>

      {open ? (
        <div className="absolute md:right-0 z-[999] max-md:bottom-10 max-md:left-7.5   md:mt-2 w-[min(100vw-1.5rem,230px)] shadow-[0_0_10px_rgba(0,0,0,0.25)] rounded bg-white p-4">
          <div className="flex flex-col gap-3">
            {showLanguage ? (
                <LanguageSwitcher />
            ) : null}
            {showStoreView ? (
                <StoreViewToggle />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
