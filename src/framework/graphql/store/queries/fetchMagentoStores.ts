export type MagentoStore = {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly website_id: number;
  readonly store_group_id: number;
  readonly is_active: boolean;
};

export type MagentoStoresQueryResponse = {
  readonly data?: {
    readonly stores?: readonly MagentoStore[];
  };
};

export const STORES_QUERY = `
  query GetStores {
    stores {
      id
      code
      name
      website_id
      store_group_id
      is_active
    }
  }
`;

type StoresFetchResponse = {
  readonly ok: boolean;
  json: () => Promise<MagentoStoresQueryResponse>;
};

/**
 * Dedicated stores query runner so query + response contract stay
 * co-located. Caller passes endpoint (`/api/graphql-proxy` on client or
 * Magento GraphQL on server).
 */
export async function fetchMagentoStores(
  endpoint: string,
): Promise<readonly MagentoStore[]> {
  try {
    const res = (await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: STORES_QUERY }),
      cache: "no-store",
    })) as StoresFetchResponse;
    if (!res.ok) return [];
    const payload = await res.json();
    return payload.data?.stores ?? [];
  } catch {
    return [];
  }
}
