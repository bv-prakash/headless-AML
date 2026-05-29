import type { StoreViewTheme, StoreViewUiComponentKey } from "@/src/theme/store-view/types";
import { BASE_STORE_VIEW_THEME } from "@/src/theme/store-view/themes/base.theme";
import {
  STORE_VIEW_THEME_OVERRIDES,
  type RecursivePartial,
} from "@/src/theme/store-view/themes/store-overrides";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function mergeDeep<T extends object>(base: T, patch: RecursivePartial<T> | undefined): T {
  if (!patch) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const pv = patch[key];
    const bv = base[key as keyof T];
    if (pv === undefined) continue;
    if (isRecord(bv) && isRecord(pv as object)) {
      out[key as string] = mergeDeep(
        bv as object,
        pv as RecursivePartial<typeof bv>,
      );
    } else {
      out[key as string] = pv;
    }
  }
  return out as T;
}

/** Resolved theme for a Magento store view code (unknown codes → base). */
export function resolveStoreViewTheme(storeViewCode: string): StoreViewTheme {
  const raw = storeViewCode?.trim() || "default";
  const patch = STORE_VIEW_THEME_OVERRIDES[raw];
  return mergeDeep(BASE_STORE_VIEW_THEME, patch);
}

/** Whether a UI chrome piece is enabled for this store (defaults true). */
export function isStoreComponentEnabled(
  key: StoreViewUiComponentKey,
  storeViewCode: string,
): boolean {
  const theme = resolveStoreViewTheme(storeViewCode);
  const v = theme.components?.[key];
  return v !== false;
}
