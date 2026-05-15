import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

/**
 * Magento B2B feature flags exposed on `StoreConfig`. This Magento instance
 * uses the flat schema (pre-`b2b_features` refactor) — flags are scalar fields
 * directly on `StoreConfig` rather than nested under a `b2b_features` object.
 */
export const STORE_CONFIG_B2B_FEATURES_QUERY = gql`
  query StoreConfigB2BFeatures {
    storeConfig {
      is_negotiable_quote_active
      is_requisition_list_active
      quickorder_active
    }
  }
`;

/**
 * Customer-scoped B2B membership signals. The Magento Company module gates
 * "Company *" sidebar items at the customer level (not in `StoreConfig`).
 * Errors are ignored so guests / non-B2B customers don't crash the sidebar.
 */
export const CUSTOMER_B2B_MEMBERSHIP_QUERY = gql`
  query CustomerB2BMembership {
    customer {
      id
      companies {
        items {
          id
          name
        }
      }
      role {
        id
        name
      }
    }
  }
`;

export type StoreConfigB2BFeatures = {
  /** Boolean in some schemas, "1"/"0" string in others. Always normalize via {@link isFeatureEnabled}. */
  readonly is_negotiable_quote_active: boolean | string | null;
  readonly is_requisition_list_active: boolean | string | null;
  readonly quickorder_active: boolean | string | null;
};

export type StoreConfigB2BFeaturesResponse = {
  readonly storeConfig: StoreConfigB2BFeatures | null;
};

export type CustomerB2BMembershipResponse = {
  readonly customer: {
    readonly id: number | string;
    readonly companies: {
      readonly items: ReadonlyArray<{ id: string; name: string }> | null;
    } | null;
    readonly role: { id: string; name: string } | null;
  } | null;
};

/** Magento returns some flags as booleans and others as "1"/"0" / "true"/"false" strings — normalize. */
export function isFeatureEnabled(value: unknown): boolean {
  if (value === true) return true;
  if (value === 1) return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "1" || v === "true";
  }
  return false;
}

/** Normalized feature flags consumed by the account sidebar to decide which items to render. */
export type B2BNavGates = {
  readonly requisitionLists: boolean;
  readonly company: boolean;
  readonly negotiableQuotes: boolean;
  readonly quickOrder: boolean;
};

export type B2BFeatureKey = keyof B2BNavGates;

/** Single hook combining `StoreConfig` flags + customer company membership into normalized gates. */
export function useB2BNavGating(): {
  readonly gates: B2BNavGates;
  readonly loading: boolean;
} {
  const storeCfg = useQuery<StoreConfigB2BFeaturesResponse>(
    STORE_CONFIG_B2B_FEATURES_QUERY,
  );
  const membership = useQuery<CustomerB2BMembershipResponse>(
    CUSTOMER_B2B_MEMBERSHIP_QUERY,
    { errorPolicy: "all" },
  );

  const cfg = storeCfg.data?.storeConfig;
  const cust = membership.data?.customer;

  /**
   * The customer is considered "in a company" if Magento reports either a
   * non-empty `companies.items` list OR a non-null `role` (different B2B
   * setups populate one or the other depending on whether the user is a
   * Company Admin or a regular Company User).
   */
  const inCompany =
    (cust?.companies?.items?.length ?? 0) > 0 || cust?.role != null;

  return {
    loading: storeCfg.loading || membership.loading,
    gates: {
      requisitionLists: isFeatureEnabled(cfg?.is_requisition_list_active),
      negotiableQuotes: isFeatureEnabled(cfg?.is_negotiable_quote_active),
      quickOrder: isFeatureEnabled(cfg?.quickorder_active),
      company: inCompany,
    },
  };
}
