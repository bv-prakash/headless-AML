import { gql } from "@apollo/client";

export const REVOKE_CUSTOMER_TOKEN_MUTATION = gql`
  mutation RevokeCustomerToken {
    revokeCustomerToken {
      result
    }
  }
`;

export type RevokeCustomerTokenResponse = {
  revokeCustomerToken: {
    result: boolean;
  };
};
