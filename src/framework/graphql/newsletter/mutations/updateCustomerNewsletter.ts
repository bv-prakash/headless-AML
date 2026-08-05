import { gql } from "@apollo/client";

/**
 * Requires a **customer** Bearer token (`Authorization: Bearer …`).
 * Update customer newsletter subscription status.
 */
export const UPDATE_CUSTOMER_NEWSLETTER_MUTATION = gql`
  mutation UpdateCustomerNewsletter($isSubscribed: Boolean!) {
    updateCustomerV2(input: { is_subscribed: $isSubscribed }) {
      customer {
        id
        is_subscribed
      }
    }
  }
`;

export type UpdateCustomerNewsletterVariables = {
  readonly isSubscribed: boolean;
};

export type UpdateCustomerNewsletterResponse = {
  updateCustomerV2: {
    customer: {
      id: string;
      is_subscribed: boolean;
    };
  } | null;
};
