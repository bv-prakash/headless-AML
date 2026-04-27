import apolloClient from "@/src/framework/graphql/apolloClient";
import {
  CREATE_EMPTY_CART_MUTATION,
  type CreateEmptyCartResponse,
} from "@/src/framework/graphql/mutations/cartMutations";
import { CART_ID_KEY } from "@/src/constants/storageKeys";
import { getScopedStoredValue } from "@/src/utils/storage";

let inflight: Promise<string | null> | null = null;

/**
 * Returns an existing masked cart id from storage, or creates one via GraphQL.
 * Concurrent callers share a single in-flight `createEmptyCart` (deduped).
 */
export async function ensureGuestCartId(): Promise<string | null> {
  const existing = getScopedStoredValue(CART_ID_KEY);
  if (existing) return existing;

  if (!inflight) {
    inflight = (async () => {
      try {
        const { data } = await apolloClient.mutate<CreateEmptyCartResponse>({
          mutation: CREATE_EMPTY_CART_MUTATION,
        });
        return data?.createEmptyCart ?? null;
      } finally {
        inflight = null;
      }
    })();
  }

  return inflight;
}
