import { NextResponse, type NextRequest } from "next/server";
import { getGraphqlEndpoint } from "@/src/framework/graphql/getGraphqlEndpoint";
import {
  getServerStoreViewCode,
  resolveStoreViewCodeForRequest,
} from "@/src/framework/store/getActiveStoreCode";
import { STORE_VIEW_COOKIE_NAME } from "@/src/config/storeViews";

type ProxyUpstreamResult = {
  readonly status: number;
  readonly contentType: string;
  readonly text: string;
};

const inflightQueryRequests = new Map<string, Promise<ProxyUpstreamResult>>();

type GraphqlOperationLike = {
  readonly query?: string;
  readonly operationName?: string;
};

function isMutationOperation(op: GraphqlOperationLike): boolean {
  const q = op.query?.trim().toLowerCase() ?? "";
  const name = op.operationName?.trim().toLowerCase() ?? "";
  return q.startsWith("mutation") || name.includes("mutation");
}

function isQueryOnlyRequest(body: unknown): boolean {
  if (!body) return false;
  if (Array.isArray(body)) {
    return body.every((op) => !isMutationOperation((op ?? {}) as GraphqlOperationLike));
  }
  return !isMutationOperation(body as GraphqlOperationLike);
}

export async function POST(req: NextRequest) {
  const endpoint = getGraphqlEndpoint();
  if (!endpoint) {
    return NextResponse.json(
      { error: "GraphQL endpoint is not configured." },
      { status: 500 },
    );
  }

  try {
    const rawBody = await req.text();
    const body: unknown = rawBody ? JSON.parse(rawBody) : {};
    const fromClient =
      req.headers.get("Store") ?? req.headers.get("store") ?? req.headers.get("x-store-code");
    const fromCookie = req.cookies.get(STORE_VIEW_COOKIE_NAME)?.value ?? null;
    const customerToken = req.headers.get("x-customer-token");
    const fallback = await getServerStoreViewCode();
    const storeCode = resolveStoreViewCodeForRequest(fromClient, fromCookie, fallback);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Store: storeCode,
    };

    if (customerToken) {
      headers.Authorization = `Bearer ${customerToken}`;
      // Some Magento / gateway setups expect this header in addition to Bearer
      headers["X-Customer-Token"] = customerToken;
    }
    /**
     * No `config.commerce.apiKey` fallback: Magento scopes `products` / `category*` by the
     * `Authorization` token (shared catalogs, customer groups, website). Sending a service
     * token for guest catalog traffic can cause `total_count: 0` on otherwise-valid categories.
     */

    const serializedBody = JSON.stringify(body);
    const requestKey = JSON.stringify({
      endpoint,
      storeCode,
      customerToken: customerToken ?? "",
      body: serializedBody,
    });
    const canDedupe = isQueryOnlyRequest(body);

    const runUpstream = async (): Promise<ProxyUpstreamResult> => {
      const upstreamRes = await fetch(endpoint, {
        method: "POST",
        headers,
        body: serializedBody,
        cache: "no-store",
      });
      const text = await upstreamRes.text();
      return {
        status: upstreamRes.status,
        contentType: upstreamRes.headers.get("content-type") ?? "application/json",
        text,
      };
    };

    const resultPromise = canDedupe
      ? (inflightQueryRequests.get(requestKey) ??
        runUpstream().finally(() => {
          inflightQueryRequests.delete(requestKey);
        }))
      : runUpstream();

    if (canDedupe && !inflightQueryRequests.has(requestKey)) {
      inflightQueryRequests.set(requestKey, resultPromise);
    }

    const result = await resultPromise;

    if (process.env.NODE_ENV !== "production") {
      const debug =
        req.headers.get("x-debug-graphql") === "1" ||
        req.nextUrl?.searchParams.get("debug") === "1";
      const isUpstreamError = result.status >= 400;
      /**
       * Auto-log every *mutation* in dev so we can see the raw
       * request body + Magento response without manual debug flags.
       * Queries (cache-deduped) still respect the `debug` flag to
       * avoid spamming the console on page loads.
       */
      const isMutation = !isQueryOnlyRequest(body);
      if (debug || isUpstreamError || isMutation) {
        const bodyPreview =
          typeof body === "object" && body !== null
            ? JSON.stringify(body).slice(0, 1200)
            : String(body);
        const responsePreview = result.text.slice(0, 1500);
        const logTag = isUpstreamError
          ? "[graphql-proxy:upstream-error]"
          : isMutation
            ? "[graphql-proxy:mutation]"
            : "[graphql-proxy]";
         
        console.log(logTag, {
          endpoint,
          upstreamStatus: result.status,
          /**
           * Don't echo the token back into logs — just confirm whether
           * one was attached so we can tell auth-related rejections
           * from genuine endpoint problems.
           */
          hasAuthorization: !!headers.Authorization,
          storeHeader: headers.Store,
          requestBody: bodyPreview,
          responseBody: responsePreview,
          deduped: canDedupe,
        });
      }
    }

    return new NextResponse(result.text, {
      status: result.status,
      headers: {
        "Content-Type": result.contentType,
        "X-Upstream-Endpoint": endpoint,
        "X-Upstream-Store": String(headers.Store ?? ""),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown proxy error";
    if (process.env.NODE_ENV !== "production") {
      console.error("GraphQL proxy error:", {
        message,
        error,
      });
    }
    return NextResponse.json(
      {
        error: "Internal GraphQL proxy error.",
        ...(process.env.NODE_ENV !== "production" ? { message } : {}),
      },
      { status: 500 },
    );
  }
}
