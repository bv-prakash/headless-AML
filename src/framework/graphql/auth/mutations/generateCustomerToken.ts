import { gql } from "@apollo/client";

export const GENERATE_CUSTOMER_TOKEN_MUTATION = gql`
  mutation GenerateCustomerToken($email: String!, $password: String!) {
    generateCustomerToken(email: $email, password: $password) {
      token
    }
  }
`;

export type GenerateCustomerTokenVariables = {
  readonly email: string;
  readonly password: string;
};

export type GenerateCustomerTokenResponse = {
  generateCustomerToken: {
    token: string;
  };
};
