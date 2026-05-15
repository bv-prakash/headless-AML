"use client";

import { useEffect, useState } from "react";
import { CUSTOMER_TOKEN_KEY } from "@/src/constants/storageKeys";
import { getStoredValue } from "@/src/utils/storage";
import type { CompanyAdvancedSettings } from "@/src/framework/graphql/queries/companyProfile";

type State = {
  readonly data: CompanyAdvancedSettings | null;
  readonly loading: boolean;
};

/**
 * Fetches the *Customer Group → Advanced Settings → Applicable Shipping
 * Methods* list via the server-side `/api/company/advanced-settings` proxy.
 *
 * Magento's storefront GraphQL doesn't expose this data — the proxy uses an
 * admin integration token (server env `COMMERCE_API_KEY`) to read the
 * customer's group from the admin REST API. When that env var is unset, the
 * proxy soft-fails with `applicable: null` so this hook returns `null` data
 * and the caller can render its fallback.
 */
export function useCompanyShippingMethods(enabled: boolean = true): State {
  const [data, setData] = useState<CompanyAdvancedSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const token = getStoredValue(CUSTOMER_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    /**
     * AbortController guards against a state update after unmount (e.g. user
     * navigates away while the REST proxy is still chained through
     * `/V1/customers/me` → `/V1/customerGroups/:id`).
     */
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    fetch("/api/company/advanced-settings", {
      method: "GET",
      headers: { "X-Customer-Token": token },
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as CompanyAdvancedSettings;
      })
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch(() => {
        /* Aborted or network error — treat as no data; UI shows fallback. */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled]);

  return { data, loading };
}
