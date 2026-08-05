import { useQuery } from "@apollo/client/react";
import {
  GET_B2B_FEATURES_QUERY,
  type B2BFeaturesResponse,
} from "@/src/framework/graphql/b2b-features/queries/getB2BFeatures";
import {
  GET_CUSTOMER_B2B_MEMBERSHIP_QUERY,
  type CustomerB2BMembershipResponse,
} from "@/src/framework/graphql/b2b-features/queries/getCustomerB2BMembership";

/** Magento returns some flags as booleans and others as "1"/"0" /
 *  "true"/"false" strings — normalize to a real boolean. */
export function isFeatureEnabled(value: unknown): boolean {
  if (value === true) return true;
  if (value === 1) return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "1" || v === "true";
  }
  return false;
}

/** Normalized feature gates consumed by the account sidebar. */
export type B2BNavGates = {
  readonly requisitionLists: boolean;
  readonly company: boolean;
  readonly negotiableQuotes: boolean;
  readonly quickOrder: boolean;
};

export type B2BFeatureKey = keyof B2BNavGates;

/**
 * Combines `StoreConfig` flags + customer company membership into
 * normalized gates. The customer is considered "in a company" if
 * Magento reports either a non-empty `companies.items` list OR a
 * non-null `role` — different B2B setups populate one or the other
 * depending on whether the user is a Company Admin or regular user.
 */
export function useB2BNavGating(): {
  readonly gates: B2BNavGates;
  readonly loading: boolean;
} {
  const storeCfg = useQuery<B2BFeaturesResponse>(GET_B2B_FEATURES_QUERY);
  const membership = useQuery<CustomerB2BMembershipResponse>(
    GET_CUSTOMER_B2B_MEMBERSHIP_QUERY,
    { errorPolicy: "all" },
  );

  const cfg = storeCfg.data?.storeConfig;
  const cust = membership.data?.customer;

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
