import { gql } from "@apollo/client";

export const UPDATE_CUSTOMER_PROFILE_MUTATION = gql`
  mutation UpdateCustomerProfile($input: CustomerInput!) {
    updateCustomerV2(input: $input) {
      customer {
        id
        firstname
        lastname
        email
      }
    }
  }
`;

export type UpdateCustomerProfileVariables = {
  readonly input: {
    readonly firstname?: string;
    readonly lastname?: string;
    readonly password?: string;
    readonly current_password?: string;
  };
};

export type UpdateCustomerProfileResponse = {
  updateCustomerV2: {
    customer: {
      id: string;
      firstname: string;
      lastname: string;
      email: string;
    };
  };
};
