"use client";

import dynamic from "next/dynamic";
import type { ProductListSortKey } from "@/src/framework/graphql/queries/plpCatalogGraphql";

const PlpClientGraphqlProbe = dynamic(
  () => import("./PlpClientGraphqlProbe"),
  { ssr: false, loading: () => null },
);

export type PlpGraphqlDebugLazyProps = {
  readonly categoryId: string;
  readonly categoryUid?: string | null;
  readonly storeViewCode: string;
  readonly filterFacets: Record<string, string[]>;
  readonly pageSize: number;
  readonly currentPage: number;
  readonly sortBy: ProductListSortKey;
};

/** Client-only shell so `ssr: false` dynamic is valid (Next 16 disallows it in Server Components). */
export default function PlpGraphqlDebugLazy(props: PlpGraphqlDebugLazyProps) {
  return <PlpClientGraphqlProbe {...props} />;
}
