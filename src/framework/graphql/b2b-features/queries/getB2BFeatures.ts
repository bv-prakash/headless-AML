import { gql } from "@apollo/client";

/**
 * Magento B2B feature flags exposed on `StoreConfig`. This Magento
 * instance uses the flat schema (pre-`b2b_features` refactor) — flags
 * are scalar fields directly on `StoreConfig` rather than nested under
 * a `b2b_features` object.
 */
export const GET_B2B_FEATURES_QUERY = gql`
  query StoreConfigB2BFeatures {
    storeConfig {
      is_negotiable_quote_active
      is_requisition_list_active
      quickorder_active
    }
  }
`;

export type B2BFeatures = {
  /** Boolean in some schemas, "1"/"0" string in others. Normalize via `isFeatureEnabled`. */
  readonly is_negotiable_quote_active: boolean | string | null;
  readonly is_requisition_list_active: boolean | string | null;
  readonly quickorder_active: boolean | string | null;
};

export type B2BFeaturesResponse = {
  readonly storeConfig: B2BFeatures | null;
};
