"use client";

import type { ReactNode } from "react";
import { resolveClientStoreViewCode } from "@/src/framework/store/resolveClientStoreViewCode";
import { useAppSelector } from "@/src/store/hooks";
import { selectStoreViewCode, selectStoreViewRevision } from "@/src/store/selectors";
import type { StoreViewUiComponentKey } from "@/src/theme/store-view/types";
import { isStoreComponentEnabled } from "@/src/theme/store-view/resolveStoreViewTheme";

type StoreViewConditionalProps = {
  readonly feature: StoreViewUiComponentKey;
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
};

/**
 * Renders `children` only when the feature flag for the active store view is enabled.
 * Re-renders when the store changes (Redux revision) and prefers cookie/localStorage via
 * {@link resolveClientStoreViewCode} so flags match before hydration.
 */
export function StoreViewConditional({ feature, children, fallback = null }: StoreViewConditionalProps) {
  useAppSelector(selectStoreViewCode);
  useAppSelector(selectStoreViewRevision);
  const storeCode = resolveClientStoreViewCode();

  if (!isStoreComponentEnabled(feature, storeCode)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
