"use client";

import { useEffect, type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/src/framework/graphql";
import { store } from "@/src/store/store";
import { hydrateAuth } from "@/src/store/slices/authSlice";
import { hydrateCompare } from "@/src/store/slices/compareSlice";
import { hydrateCart } from "@/src/store/slices/cartSlice";
import { hydrateWishlist } from "@/src/store/slices/wishlistSlice";
import GuestCartPrefetch from "@/src/components/cart/GuestCartPrefetch";

function StoreHydrator({ children }: { children: ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateAuth());
    store.dispatch(hydrateCompare());
    store.dispatch(hydrateCart());
    store.dispatch(hydrateWishlist());
  }, []);

  return (
    <>
      <GuestCartPrefetch />
      {children}
    </>
  );
}

export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ReduxProvider store={store}>
      <ApolloProvider client={apolloClient}>
        <StoreHydrator>{children}</StoreHydrator>
      </ApolloProvider>
    </ReduxProvider>
  );
}
