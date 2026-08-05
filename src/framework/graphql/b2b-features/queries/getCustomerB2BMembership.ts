import { gql } from "@apollo/client";

/**
 * Customer-scoped B2B membership signals. The Magento Company module
 * gates "Company *" sidebar items at the customer level (not in
 * `StoreConfig`). Call-sites pass `errorPolicy: "all"` so guests /
 * non-B2B customers don't crash the sidebar.
 */
export const GET_CUSTOMER_B2B_MEMBERSHIP_QUERY = gql`
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

export type CustomerB2BMembershipResponse = {
  readonly customer: {
    readonly id: number | string;
    readonly companies: {
      readonly items: ReadonlyArray<{ id: string; name: string }> | null;
    } | null;
    readonly role: { id: string; name: string } | null;
  } | null;
};
