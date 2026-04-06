import config from "@/src/config/config";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getGraphqlEndpoint } from "@/src/framework/graphql/getGraphqlEndpoint";
import { CUSTOMER_TOKEN_KEY } from "@/src/constants/storageKeys";
import { getStoredValue } from "@/src/utils/storage";

const IS_SERVER = typeof window === "undefined";

const uri = IS_SERVER ? getGraphqlEndpoint() : "/api/graphql-proxy";

if (!uri) {
  throw new Error(
    "GraphQL endpoint is not configured. "
    + "Set NEXT_PUBLIC_COMMERCE_BASE_URL or NEXT_PUBLIC_GRAPHQL_ENDPOINT.",
  );
}

const httpLink = new HttpLink({
  uri,
  ...(IS_SERVER
    ? { fetchOptions: { next: { revalidate: 300 } } as unknown as RequestInit }
    : {}),
});

const authLink = setContext((_, { headers }) => {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    ...((headers as Record<string, string>) ?? {}),
  };

  if (IS_SERVER) {
    if (config.commerce.storeCode) {
      base.Store = config.commerce.storeCode;
    }
    if (config.commerce.apiKey) {
      base.Authorization = `Bearer ${config.commerce.apiKey}`;
    }
  } else {
    const token = getStoredValue(CUSTOMER_TOKEN_KEY);
    if (token) {
      base["X-Customer-Token"] = token;
    }
  }

  return { headers: base };
});

const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-first" },
    query: { fetchPolicy: "cache-first" },
    mutate: { fetchPolicy: "no-cache" },
  },
});

export default apolloClient;
