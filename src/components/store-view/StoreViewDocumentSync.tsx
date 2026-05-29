"use client";

import { useLayoutEffect } from "react";
import { resolveClientStoreViewCode } from "@/src/framework/store/resolveClientStoreViewCode";
import { useAppSelector } from "@/src/store/hooks";
import { selectStoreViewCode, selectStoreViewRevision } from "@/src/store/selectors";
import { applyStoreViewThemeToRoot, resolveStoreViewTheme } from "@/src/theme/store-view";

/**
 * Keeps `document.documentElement` in sync with the active store view: `data-store-view`,
 * centralized CSS variables from {@link resolveStoreViewTheme}, and brand tokens.
 */
export function StoreViewDocumentSync() {
  const code = useAppSelector(selectStoreViewCode);
  const revision = useAppSelector(selectStoreViewRevision);

  useLayoutEffect(() => {
    const resolved = resolveClientStoreViewCode();
    const root = document.documentElement;
    root.dataset.storeView = resolved;
    applyStoreViewThemeToRoot(root, resolveStoreViewTheme(resolved));
  }, [code, revision]);

  return null;
}
