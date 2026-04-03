import config from "@/src/config/config";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { getGraphqlEndpoint } from "@/src/framework/graphql/getGraphqlEndpoint";

const IS_SERVER = typeof window === "undefined";

const uri = IS_SERVER ? getGraphqlEndpoint() : "/api/graphql-proxy";

if (!uri) {
  throw new Error(
    "GraphQL endpoint is not configured. "
    + "Set NEXT_PUBLIC_COMMERCE_BASE_URL or NEXT_PUBLIC_GRAPHQL_ENDPOINT.",
  );
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (IS_SERVER) {
    if (config.commerce.storeCode) {
      headers.Store = config.commerce.storeCode;
    }
    if (config.commerce.apiKey) {
      headers.Authorization = `Bearer ${config.commerce.apiKey}`;
    }
  }

  return headers;
}

const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri,
    headers: buildHeaders(),
    ...(IS_SERVER
      ? { fetchOptions: { next: { revalidate: 300 } } as unknown as RequestInit }
      : {}),
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-first" },
    query: { fetchPolicy: "cache-first" },
    mutate: { fetchPolicy: "no-cache" },
  },
});

export default apolloClient;
