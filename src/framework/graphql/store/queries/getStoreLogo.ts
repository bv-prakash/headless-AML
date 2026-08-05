import config from "@/src/config/config";
import { getStoreConfig } from "./getStoreConfig";

export type StoreLogoData = {
  readonly header_logo_src: string;
  readonly header_logo_url: string;
  readonly logo_alt: string;
  readonly logo_width: number;
  readonly logo_height: number;
};

function resolveMediaUrl(pathOrUrl: string): string {
  const value = (pathOrUrl ?? "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const base = (config.imageDomain ?? "").trim();
  if (!base) return value;

  const baseNormalized = base.endsWith("/") ? base : `${base}/`;
  let normalized = value.startsWith("/") ? value.slice(1) : value;

  if (
    baseNormalized.endsWith("/media/") &&
    normalized.startsWith("stores/") &&
    !normalized.startsWith("logo/")
  ) {
    normalized = `logo/${normalized}`;
  }

  return `${baseNormalized}${normalized}`;
}

/**
 * Header logo from the same cached `getStoreConfig` document as footer
 * / PLP — avoids a separate Apollo POST on the server.
 */
export async function getStoreLogo(
  explicitStoreViewCode?: string,
): Promise<StoreLogoData | null> {
  const trimmed = explicitStoreViewCode?.trim();
  const cfg = trimmed
    ? await getStoreConfig(trimmed)
    : await getStoreConfig();
  const src = (cfg.header_logo_src ?? "").trim();
  if (!src) return null;

  return {
    header_logo_src: src,
    header_logo_url: resolveMediaUrl(src),
    logo_alt: (cfg.logo_alt ?? "").trim() || "Store logo",
    logo_width: cfg.logo_width && cfg.logo_width > 0 ? cfg.logo_width : 242,
    logo_height: cfg.logo_height && cfg.logo_height > 0 ? cfg.logo_height : 20,
  };
}
