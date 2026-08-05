import { gql } from "@apollo/client";

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
