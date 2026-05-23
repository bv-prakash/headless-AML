"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { resolveClientStoreViewCode } from "@/src/framework/store/resolveClientStoreViewCode";
import {
  PLP_PRODUCTS_BY_CATEGORY_QUERY,
  toMagentoProductsByCategoryVariables,
  type MagentoProductsByCategoryVariables,
  type ProductListSortKey,
} from "@/src/framework/graphql/plp/plpCatalogGraphql";

function decodeCategoryUid(uid: string | null | undefined): string | null {
  const t = uid?.trim();
  if (!t) return null;
  try {
    if (typeof atob === "function") return atob(t);
  } catch {
    return null;
  }
  return null;
}

type PlpClientGraphqlProbeProps = {
  readonly categoryId: string;
  readonly categoryUid?: string | null;
  readonly storeViewCode: string;
  readonly filterFacets: Record<string, string[]>;
  readonly pageSize: number;
  readonly currentPage: number;
  readonly sortBy: ProductListSortKey;
};

/** DocumentNode built once from the same template used by the server fetch. */
const PLP_PRODUCTS_BY_CATEGORY_DOCUMENT = gql`
  ${PLP_PRODUCTS_BY_CATEGORY_QUERY}
`;

type ProbeQueryResponse = {
  products?: {
    total_count?: number | null;
    items?: ReadonlyArray<{ __typename?: string }> | null;
  } | null;
};

/**
 * Dev-only: runs the PLP `products` query via the shared Apollo client (same transport
 * as `SearchBar`, `WishlistIcon`, etc.). Add `?debug_plp=1` to the PLP URL.
 */
export default function PlpClientGraphqlProbe({
  categoryId,
  categoryUid,
  storeViewCode,
  filterFacets,
  pageSize,
  currentPage,
  sortBy,
}: PlpClientGraphqlProbeProps) {
  const storeHeader = storeViewCode?.trim() || resolveClientStoreViewCode();

  const variables: MagentoProductsByCategoryVariables = useMemo(() => {
    const hasFacetCategoryUid =
      (filterFacets.category_uid?.length ?? 0) > 0;
    const scopeUid =
      categoryUid?.trim() && !hasFacetCategoryUid
        ? categoryUid.trim()
        : null;
    return toMagentoProductsByCategoryVariables({
      categoryId,
      filterFacets,
      pageSize,
      currentPage,
      sort: sortBy,
      categoryScopeUid: scopeUid,
    });
  }, [categoryId, categoryUid, filterFacets, pageSize, currentPage, sortBy]);

  const { data, error, loading, refetch } = useQuery<
    ProbeQueryResponse,
    MagentoProductsByCategoryVariables
  >(PLP_PRODUCTS_BY_CATEGORY_DOCUMENT, {
    variables,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const status = loading ? "loading" : error ? "err" : data ? "ok" : "idle";
  const totalCount = data?.products?.total_count ?? null;
  const itemsCount = data?.products?.items?.length ?? 0;
  const decodedUid = useMemo(() => {
    const v = variables.filter?.category_uid?.eq;
    return decodeCategoryUid(typeof v === "string" ? v : null);
  }, [variables]);

  const [rawProbe, setRawProbe] = useState<{
    status: number;
    endpoint: string;
    storeHeader: string;
    body: string;
  } | null>(null);
  const [rawLoading, setRawLoading] = useState(false);

  const runRawProbe = useCallback(async () => {
    setRawLoading(true);
    setRawProbe(null);
    try {
      const res = await fetch("/api/graphql-proxy?debug=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Store: storeHeader,
          "X-Debug-Graphql": "1",
        },
        body: JSON.stringify({
          query: PLP_PRODUCTS_BY_CATEGORY_QUERY,
          variables,
        }),
      });
      const text = await res.text();
      setRawProbe({
        status: res.status,
        endpoint: res.headers.get("x-upstream-endpoint") ?? "(unknown)",
        storeHeader: res.headers.get("x-upstream-store") ?? storeHeader,
        body: text,
      });
    } catch (e) {
      setRawProbe({
        status: 0,
        endpoint: "(fetch error)",
        storeHeader,
        body: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setRawLoading(false);
    }
  }, [storeHeader, variables]);

  useEffect(() => {
    void runRawProbe();
  }, [runRawProbe]);

  return (
    <section className="container my-6 rounded border border-amber-600 bg-amber-50 p-4 text-left text-sm text-neutral-900">
      <h2 className="mb-2 text-base font-bold">
        PLP GraphQL probe (Apollo `useQuery` via /api/graphql-proxy)
      </h2>
      <p className="mb-2 text-xs">
        Status: <strong>{status}</strong>
        {" · "}
        <code className="rounded bg-white px-1">Store</code>:{" "}
        <strong>{storeHeader}</strong>
        {totalCount !== null ? (
          <>
            {" · "}total_count: <strong>{totalCount}</strong> · items:{" "}
            <strong>{itemsCount}</strong>
          </>
        ) : null}
        {decodedUid ? (
          <>
            {" · "}category_uid decodes to <strong>{decodedUid}</strong>
          </>
        ) : null}
      </p>
      {rawProbe ? (
        <p className="mb-2 text-xs">
          Upstream endpoint: <code className="rounded bg-white px-1">{rawProbe.endpoint}</code>
          {" · "}upstream HTTP: <strong>{rawProbe.status}</strong>
          {" · "}upstream Store header: <strong>{rawProbe.storeHeader}</strong>
        </p>
      ) : null}
      <details open className="max-h-[40vh] overflow-auto rounded border border-amber-200 bg-white">
        <summary className="cursor-pointer px-2 py-1 text-xs font-semibold">
          Request variables
        </summary>
        <pre className="max-h-[35vh] overflow-auto whitespace-pre-wrap break-all p-2 text-[11px] leading-snug">
          {JSON.stringify(variables, null, 2)}
        </pre>
      </details>
      <details className="mt-2 max-h-[40vh] overflow-auto rounded border border-amber-200 bg-white">
        <summary className="cursor-pointer px-2 py-1 text-xs font-semibold">
          Raw response
        </summary>
        <pre className="max-h-[35vh] overflow-auto whitespace-pre-wrap break-all p-2 text-[11px] leading-snug">
          {error
            ? error.message
            : data
              ? JSON.stringify(data, null, 2)
              : "(empty)"}
        </pre>
      </details>
      <details className="mt-2 max-h-[40vh] overflow-auto rounded border border-amber-200 bg-white">
        <summary className="cursor-pointer px-2 py-1 text-xs font-semibold">
          Raw (direct fetch, bypasses Apollo cache)
        </summary>
        <pre className="max-h-[35vh] overflow-auto whitespace-pre-wrap break-all p-2 text-[11px] leading-snug">
          {rawLoading
            ? "(loading…)"
            : rawProbe
              ? rawProbe.body || "(empty body)"
              : "(no raw probe yet)"}
        </pre>
      </details>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border border-amber-800 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-amber-100"
          onClick={() => {
            void refetch();
          }}
        >
          Replay via Apollo
        </button>
        <button
          type="button"
          className="rounded border border-amber-800 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-amber-100"
          onClick={() => {
            void runRawProbe();
          }}
        >
          Replay direct fetch
        </button>
      </div>
      <p className="mt-2 text-[11px] text-neutral-700">
        Compare the <em>Upstream endpoint</em> and <em>Store header</em> above with Altair's request.
        If they match but Altair returns products and this returns zero, Magento is scoping the result by
        something the app does not send (customer token, cookie, IP). If the endpoint differs, the app is
        hitting a different Magento instance than Altair.
      </p>
    </section>
  );
}
