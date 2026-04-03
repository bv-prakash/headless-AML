import config from "@/src/config/config";
import { getGraphqlEndpoint } from "@/src/framework/graphql/getGraphqlEndpoint";
import { getActiveStoreCode } from "@/src/framework/store/getActiveStoreCode";

type GraphqlFetchOptions = {
  revalidate?: number;
};

type GraphqlPayload<TData> = {
  data?: TData;
  errors?: ReadonlyArray<{ message?: string }>;
};

const DEFAULT_REVALIDATE_SECONDS = 300;

class MagentoGraphqlError extends Error {
  constructor(
    message: string,
    public readonly graphqlErrors?: ReadonlyArray<{ message?: string }>,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "MagentoGraphqlError";
  }
}

export async function magentoGraphqlFetch<TData>(
  query: string,
  variables?: Record<string, unknown>,
  options: GraphqlFetchOptions = {},
): Promise<TData> {
  const endpoint = getGraphqlEndpoint();
  if (!endpoint) {
    throw new MagentoGraphqlError(
      "Magento GraphQL endpoint is not configured. Check NEXT_PUBLIC_COMMERCE_BASE_URL or NEXT_PUBLIC_GRAPHQL_ENDPOINT.",
    );
  }

  const storeCode = getActiveStoreCode();
  const { revalidate = DEFAULT_REVALIDATE_SECONDS } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Store: storeCode,
  };

  if (config.commerce.apiKey) {
    headers.Authorization = `Bearer ${config.commerce.apiKey}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });

  if (!res.ok) {
    throw new MagentoGraphqlError(
      `Magento GraphQL HTTP ${res.status} ${res.statusText}`,
      undefined,
      res.status,
    );
  }

  const payload = (await res.json()) as GraphqlPayload<TData>;

  if (payload.errors?.length) {
    const messages = payload.errors
      .map((e) => e.message)
      .filter(Boolean)
      .join("; ");
    throw new MagentoGraphqlError(messages, payload.errors);
  }

  if (!payload.data) {
    throw new MagentoGraphqlError("Magento GraphQL returned no data.");
  }

  return payload.data;
}
