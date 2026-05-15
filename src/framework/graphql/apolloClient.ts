import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { getGraphqlEndpoint } from "@/src/framework/graphql/getGraphqlEndpoint";
import { invalidateCustomerSession } from "@/src/framework/graphql/invalidateCustomerSession";
import { CUSTOMER_TOKEN_KEY } from "@/src/constants/storageKeys";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";
import { resolveClientStoreViewCode } from "@/src/framework/store/resolveClientStoreViewCode";
import { getStoredValue } from "@/src/utils/storage";
import {
  isStaleCartError,
  messagesIndicateInvalidCustomerSession,
} from "@/src/utils/errors";

const IS_SERVER = typeof window === "undefined";

const uri = IS_SERVER ? getGraphqlEndpoint() : "/api/graphql-proxy";

if (!uri) {
  throw new Error(
    "GraphQL endpoint is not configured. "
    + "Set NEXT_PUBLIC_COMMERCE_BASE_URL or NEXT_PUBLIC_GRAPHQL_ENDPOINT.",
  );
}

/**
 * Server: `cache: "no-store"` so Next’s fetch layer never serves one GraphQL response
 * for another when only the `Store` header differs (same POST body).
 */
const httpLink = new HttpLink({
  uri,
  ...(IS_SERVER
    ? {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, {
            ...init,
            cache: "no-store",
          }),
      }
    : {}),
});

const errorLink = new ErrorLink(({ error }) => {
  if (IS_SERVER) return;
  if (!getStoredValue(CUSTOMER_TOKEN_KEY)) return;

  if (CombinedGraphQLErrors.is(error)) {
    const combined = error.errors.map((e) => e.message).join(" ");
    /** Cart / merge ACL errors often use `graphql-authorization` — not a dead session. */
    if (isStaleCartError(combined)) return;
    if (messagesIndicateInvalidCustomerSession(combined)) {
      invalidateCustomerSession();
    }
    return;
  }

  if (error instanceof Error) {
    const msg = error.message ?? "";
    if (/status code 401|unauthorized/i.test(msg)) {
      invalidateCustomerSession();
      return;
    }
    if (isStaleCartError(error.message)) return;
    if (messagesIndicateInvalidCustomerSession(error.message)) {
      invalidateCustomerSession();
    }
  }
});

const authLink = setContext(async (_, { headers }) => {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    ...((headers as Record<string, string>) ?? {}),
  };

  const storeCode = IS_SERVER
    ? await getServerStoreViewCode()
    : resolveClientStoreViewCode();
  base.Store = storeCode;

  /**
   * No server-side `Authorization: Bearer <apiKey>` — Magento scopes catalog by token, which
   * hides products for guest users. Customer mutations attach `X-Customer-Token` below and the
   * `/api/graphql-proxy` forwards it as a customer Bearer.
   */
  if (!IS_SERVER) {
    const token = getStoredValue(CUSTOMER_TOKEN_KEY);
    if (token) {
      base["X-Customer-Token"] = token;
    }
  }

  return { headers: base };
});

const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  queryDeduplication: true,
  cache: new InMemoryCache({
    typePolicies: {
      /** Same logged-in user from `CustomerWishlist`, `CustomerForCheckout`, etc. */
      Customer: { keyFields: ["id"] },
      Query: {
        fields: {
          /** Avoid cache loss when one query has `wishlist` and another has `addresses`. */
          customer: {
            merge(existing, incoming, { mergeObjects }) {
              return mergeObjects(existing, incoming);
            },
          },
          /** Avoid cache loss when one query has totals/items and another has checkout options. */
          cart: {
            merge(existing, incoming, { mergeObjects }) {
              return mergeObjects(existing, incoming);
            },
          },
        },
      },
      /** Magento cart has stable masked `id` (we include it in all cart queries). */
      Cart: { keyFields: ["id"] },
      SimpleProduct: { keyFields: ["uid"] },
      ConfigurableProduct: { keyFields: ["uid"] },
      BundleProduct: { keyFields: ["uid"] },
      DownloadableProduct: { keyFields: ["uid"] },
      VirtualProduct: { keyFields: ["uid"] },
      GroupedProduct: { keyFields: ["uid"] },
      StoreConfig: { keyFields: [] },
      CompareList: { keyFields: ["uid"] },
      CategoryTree: { keyFields: ["id"] },
      /**
       * Company ACL resource nodes appear in TWO unrelated trees:
       *   - `Company.acl_resources` → master tree of every grantable resource
       *   - `CompanyRole.permissions` → only the *granted* branches
       *
       * Both trees use `CompanyAclResource` and share node ids (e.g.
       * `Magento_Sales`). With default `__typename:id` normalisation Apollo
       * would write both into the same cache slot, and the role's smaller
       * `children` list would overwrite the master tree's children — which
       * is why the edit form rendered only the granted branches instead of
       * the full permission tree.
       *
       * `keyFields: false` makes these objects embedded values, so each
       * query keeps its own tree intact.
       */
      CompanyAclResource: { keyFields: false },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-first" },
    query: { fetchPolicy: "cache-first" },
    mutate: { fetchPolicy: "no-cache" },
  },
});

export default apolloClient;
