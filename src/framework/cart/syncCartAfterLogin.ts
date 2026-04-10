import apolloClient from "@/src/framework/graphql/apolloClient";
import {
  CUSTOMER_CART_QUERY,
  MERGE_CARTS_MUTATION,
  type CartData,
  type CustomerCartQueryResponse,
  type MergeCartsResponse,
  type MergeCartsVariables,
} from "@/src/framework/graphql/mutations/cartMutations";
import { writeCartQueryToCache } from "@/src/framework/graphql/writeCartQueryCache";
import type { AppDispatch } from "@/src/store/store";
import { clearCart, setCart, setCartId } from "@/src/store/slices/cartSlice";

export type SyncedCart = { readonly cartId: string; readonly cart: CartData };

function toSyncedCart(cart: CartData | null | undefined): SyncedCart | null {
  if (!cart?.id) return null;
  const cartId = cart.id;
  // `cartId` is stored separately in Redux; drop `id` from the cart payload.
  // eslint/ts: avoid unused destructured vars.
  const { id: _id, ...rest } = cart;
  return { cartId, cart: rest };
}

/**
 * After `login()` has persisted the customer token, loads the correct cart:
 * merges the guest cart when present, otherwise fetches `customerCart` so
 * badge/minicart reflect items without another add-to-cart.
 *
 * If merge fails (stale guest mask, etc.), clears that id before loading
 * `customerCart` so nothing keeps calling `cart(cart_id: …)` with an invalid id.
 */
export async function syncCartAfterLogin(
  guestCartId: string | null | undefined,
  dispatch: AppDispatch,
): Promise<SyncedCart | null> {
  const guest = guestCartId?.trim() || null;

  if (guest) {
    let merged: SyncedCart | null = null;
    try {
      const result = await apolloClient.mutate<
        MergeCartsResponse,
        MergeCartsVariables
      >({
        mutation: MERGE_CARTS_MUTATION,
        variables: { source_cart_id: guest },
        errorPolicy: "all",
      });
      if (!result.error) {
        merged = toSyncedCart(result.data?.mergeCarts);
      }
    } catch {
      merged = null;
    }
    if (merged) return merged;
    dispatch(clearCart());
  }

  try {
    const { data } = await apolloClient.query<CustomerCartQueryResponse>({
      query: CUSTOMER_CART_QUERY,
      fetchPolicy: "network-only",
    });
    const synced = toSyncedCart(data?.customerCart);
    if (synced) return synced;
  } catch {
    // ignore
  }

  dispatch(clearCart());
  return null;
}

export function applySyncedCart(dispatch: AppDispatch, synced: SyncedCart): void {
  dispatch(setCartId(synced.cartId));
  dispatch(setCart(synced.cart));
  writeCartQueryToCache(apolloClient.cache, synced.cartId, synced.cart);
}
