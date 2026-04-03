import { NextResponse, type NextRequest } from "next/server";
import config from "@/src/config/config";
import { getGraphqlEndpoint } from "@/src/framework/graphql/getGraphqlEndpoint";
import { getActiveStoreCode } from "@/src/framework/store/getActiveStoreCode";

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
    const storeCode = getActiveStoreCode();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Store: storeCode,
    };

    if (config.commerce.apiKey) {
      headers.Authorization = `Bearer ${config.commerce.apiKey}`;
    }

    const upstreamRes = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await upstreamRes.text();

    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type":
          upstreamRes.headers.get("content-type") ?? "application/json",
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
