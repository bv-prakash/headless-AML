import config from "@/src/config/config";

/**
 * Downgrades DDEV `https` to `http` in non-production so local SSL certs
 * don't block server-side fetch.
 */
function normalizeDdevUrl(url: string): string {
  if (
    process.env.NODE_ENV !== "production" &&
    url.startsWith("https://") &&
    url.includes(".ddev.site")
  ) {
    return url.replace("https://", "http://");
  }
  return url;
}

/**
 * Resolves Magento GraphQL URL.
 *
 * Adobe documents the PaaS/on-premises endpoint as `https://<commerce-server>/graphql`; SaaS uses a
 * different host pattern. See https://developer.adobe.com/commerce/webapi/graphql/
 *
 * Priority:
 * 1. Absolute `NEXT_PUBLIC_GRAPHQL_ENDPOINT` (starts with http).
 * 2. `NEXT_PUBLIC_COMMERCE_BASE_URL` that already ends with `/graphql`.
 * 3. `baseUrl` + explicit endpoint or config default (`/graphql`).
 */
export function getGraphqlEndpoint(): string {
  const explicit = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT?.trim();
  if (explicit?.startsWith("http")) {
    return normalizeDdevUrl(explicit);
  }

  const baseUrl = config.commerce.baseUrl?.trim() ?? "";
  if (!baseUrl) return "";

  if (baseUrl.endsWith("/graphql")) {
    return normalizeDdevUrl(baseUrl);
  }

  const path =
    explicit && explicit.startsWith("/")
      ? explicit
      : `/${(explicit || config.graphqlEndpoint).replace(/^\//, "") || "graphql"}`;

  return normalizeDdevUrl(`${baseUrl.replace(/\/$/, "")}${path}`);
}
