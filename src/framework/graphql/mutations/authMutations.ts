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

export const CREATE_CUSTOMER_MUTATION = gql`
  mutation CreateCustomer($input: CustomerCreateInput!) {
    createCustomerV2(input: $input) {
      customer {
        firstname
        lastname
        email
        is_subscribed
      }
    }
  }
`;

export type CreateCustomerVariables = {
  readonly input: {
    readonly firstname: string;
    readonly lastname: string;
    readonly email: string;
    readonly password: string;
    readonly is_subscribed: boolean;
  };
};

export type CreateCustomerResponse = {
  createCustomerV2: {
    customer: {
      firstname: string;
      lastname: string;
      email: string;
      is_subscribed: boolean;
    };
  };
};

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
