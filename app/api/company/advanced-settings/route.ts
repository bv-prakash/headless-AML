import { NextResponse, type NextRequest } from "next/server";
import { getGraphqlEndpoint } from "@/src/framework/graphql/getGraphqlEndpoint";

/**
 * Magento storefront GraphQL exposes `Company.payment_methods` but not
 * `Company.shipping_methods`. The "Allowed Shipping Methods" list users see
 * in the admin's *Customer Group → Advanced Settings* page is only reachable
 * via the admin REST API at `/rest/V1/customerGroups/:id` (response shape:
 * `extension_attributes.applicable_shipping_method` + `available_shipping_methods`).
 *
 * Flow:
 *   1. Customer's auth token (forwarded as `X-Customer-Token`) hits
 *      `/V1/customers/me` to resolve the customer's `group_id`.
 *   2. The admin integration token (`COMMERCE_API_KEY` server env) hits
 *      `/V1/customerGroups/{group_id}` to get the applicable shipping methods.
 *
 * Both Magento calls run server-side from this route — the admin token never
 * reaches the browser, and the customer token isn't trusted beyond resolving
 * its own `group_id`.
 */

/** Magento REST base — derived from the GraphQL endpoint to stay consistent across environments. */
function getRestBase(): string | null {
  const gql = getGraphqlEndpoint();
  if (!gql) return null;
  // Replace trailing /graphql with /rest/V1
  return gql.replace(/\/graphql\/?$/, "") + "/rest/V1";
}

type AdvancedSettingsResponse = {
  readonly shipping_methods: ReadonlyArray<string> | null;
  /**
   * Magento's `applicable_shipping_method` flag:
   *   "0" = use store config (all enabled methods)
   *   "1" = use the restricted list in `available_shipping_methods`
   * Surfaced so the UI can distinguish "no restriction" from "empty list".
   */
  readonly applicable: "all" | "selected" | null;
};

type CustomerMeResponse = {
  readonly group_id?: number;
};

type CustomerGroupResponse = {
  readonly extension_attributes?: {
    readonly applicable_shipping_method?: number | string;
    readonly available_shipping_methods?: ReadonlyArray<string>;
  };
};

async function fetchCustomerGroupId(
  restBase: string,
  customerToken: string,
): Promise<number | null> {
  const res = await fetch(`${restBase}/customers/me`, {
    headers: {
      Authorization: `Bearer ${customerToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as CustomerMeResponse;
  return typeof json.group_id === "number" ? json.group_id : null;
}

async function fetchGroupShippingMethods(
  restBase: string,
  adminToken: string,
  groupId: number,
): Promise<AdvancedSettingsResponse> {
  const res = await fetch(`${restBase}/customerGroups/${groupId}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    return { shipping_methods: null, applicable: null };
  }
  const json = (await res.json()) as CustomerGroupResponse;
  const flag = json.extension_attributes?.applicable_shipping_method;
  const list = json.extension_attributes?.available_shipping_methods ?? null;
  /**
   * Magento returns the flag inconsistently across versions:
   *   number `0`/`1` in newer 2.4.x, string `"0"`/`"1"` in older builds.
   * Normalise both to the typed union.
   */
  const applicable =
    flag == null
      ? null
      : String(flag) === "1"
        ? "selected"
        : "all";
  return {
    shipping_methods:
      applicable === "selected" ? list : null,
    applicable,
  };
}

export async function GET(req: NextRequest) {
  const customerToken = req.headers.get("x-customer-token");
  if (!customerToken) {
    return NextResponse.json(
      { error: "Customer not authenticated.", code: "no-customer-token" },
      { status: 401 },
    );
  }

  const adminToken = process.env.COMMERCE_API_KEY?.trim();
  if (!adminToken) {
    /**
     * Soft-fail (200 with `applicable: null`) so the UI degrades gracefully
     * to its placeholder instead of showing a red error banner. Surface the
     * code so ops can spot it in DevTools.
     */
    return NextResponse.json(
      {
        shipping_methods: null,
        applicable: null,
        code: "admin-token-missing",
        hint: "Set COMMERCE_API_KEY env to a Magento admin integration token to enable this endpoint.",
      } satisfies AdvancedSettingsResponse & { code: string; hint: string },
      { status: 200 },
    );
  }

  const restBase = getRestBase();
  if (!restBase) {
    return NextResponse.json(
      { error: "Magento endpoint not configured.", code: "no-endpoint" },
      { status: 500 },
    );
  }

  try {
    const groupId = await fetchCustomerGroupId(restBase, customerToken);
    if (groupId == null) {
      return NextResponse.json(
        {
          shipping_methods: null,
          applicable: null,
          code: "no-group-id",
        } satisfies AdvancedSettingsResponse & { code: string },
        { status: 200 },
      );
    }
    const result = await fetchGroupShippingMethods(restBase, adminToken, groupId);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[company/advanced-settings]", err);
    }
    return NextResponse.json(
      {
        shipping_methods: null,
        applicable: null,
        code: "fetch-failed",
      } satisfies AdvancedSettingsResponse & { code: string },
      { status: 200 },
    );
  }
}
