"use client";

import { type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/src/framework/graphql";
import { store } from "@/src/store/store";
import { StoreHydrator } from "./StoreHydrator";
import { StoreViewDocumentSync } from "@/src/components/store-view/StoreViewDocumentSync";

export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ReduxProvider store={store}>
      <ApolloProvider client={apolloClient}>
        <StoreHydrator>
          <StoreViewDocumentSync />
          {children}
        </StoreHydrator>
      </ApolloProvider>
    </ReduxProvider>
  );
}
