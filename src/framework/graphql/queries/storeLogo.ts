import { gql } from "@apollo/client";
import client from "@/src/framework/graphql/apolloClient";
import config from "@/src/config/config";

type StoreLogoData = {
  readonly header_logo_src: string;
  readonly header_logo_url: string;
  readonly logo_alt: string;
  readonly logo_width: number;
  readonly logo_height: number;
};

type StoreLogoConfigResponse = {
  storeConfig?: Omit<StoreLogoData, "header_logo_url"> | null;
};

const STORE_LOGO_QUERY = gql`
  query StoreLogo {
    storeConfig {
      header_logo_src
      logo_alt
      logo_width
      logo_height
    }
  }
`;

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

export async function getStoreLogo(): Promise<StoreLogoData | null> {
  try {
    const result = await client.query<StoreLogoConfigResponse>({
      query: STORE_LOGO_QUERY,
      fetchPolicy: "cache-first",
    });

    const storeConfig = result.data?.storeConfig;
    if (!storeConfig) return null;

    return {
      ...storeConfig,
      header_logo_url: resolveMediaUrl(storeConfig.header_logo_src),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Store logo GraphQL request failed:", error);
    }
    return null;
  }
}
