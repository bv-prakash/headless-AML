import type { ApolloCache } from "@apollo/client";
import { CART_QUERY } from "@/src/framework/graphql/mutations/cartMutations";
import type { CartData } from "@/src/framework/graphql/mutations/cartMutations";

/** Keeps `CART_QUERY` aligned with mutation results so badge, minicart, and cart page stay in sync. */
export function writeCartQueryToCache(
  cache: ApolloCache,
  cartId: string,
  cart: CartData,
): void {
  if (!cartId) return;
  /** `CART_QUERY` selects `id`; stripped carts from `toSyncedCart` must still satisfy the shape. */
  const cartForCache: CartData = {
    ...cart,
    id: cart.id ?? cartId,
  };
  try {
    cache.writeQuery({
      query: CART_QUERY,
      variables: { cartId },
      data: { cart: cartForCache },
    });
  } catch {
    /* Shape drift or partial cart — avoid taking down the app */
  }
}
