import { NextResponse, type NextRequest } from "next/server";
import { getGraphqlEndpoint } from "@/src/framework/graphql/getGraphqlEndpoint";
import {
  getActiveStoreCode,
  normalizeStoreViewCode,
} from "@/src/framework/store/getActiveStoreCode";
import { STORE_VIEW_COOKIE_NAME } from "@/src/config/storeViews";

export async function POST(req: NextRequest) {
  const endpoint = getGraphqlEndpoint();
  if (!endpoint) {
    return NextResponse.json(
      { error: "GraphQL endpoint is not configured." },
      { status: 500 },
    );
  }

  try {
    const body: unknown = await req.json();
    const fromClient =
      req.headers.get("Store") ?? req.headers.get("store") ?? req.headers.get("x-store-code");
    const fromCookie = req.cookies.get(STORE_VIEW_COOKIE_NAME)?.value ?? null;
    const storeCode =
      normalizeStoreViewCode(fromClient)
      ?? normalizeStoreViewCode(fromCookie)
      ?? getActiveStoreCode();
    const customerToken = req.headers.get("x-customer-token");

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

    const upstreamRes = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await upstreamRes.text();

    if (process.env.NODE_ENV !== "production") {
      const debug =
        req.headers.get("x-debug-graphql") === "1" ||
        req.nextUrl?.searchParams.get("debug") === "1";
      if (debug) {
        const bodyPreview =
          typeof body === "object" && body !== null
            ? JSON.stringify(body).slice(0, 800)
            : String(body);
        const responsePreview = text.slice(0, 800);
        console.log("[graphql-proxy]", {
          endpoint,
          upstreamStatus: upstreamRes.status,
          requestHeaders: headers,
          requestBody: bodyPreview,
          responseBody: responsePreview,
        });
      }
    }

    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type":
          upstreamRes.headers.get("content-type") ?? "application/json",
        "X-Upstream-Endpoint": endpoint,
        "X-Upstream-Store": String(headers.Store ?? ""),
      },
    });
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("GraphQL proxy error:", error);
    }
    return NextResponse.json(
      { error: "Internal GraphQL proxy error." },
      { status: 500 },
    );
  }
}
