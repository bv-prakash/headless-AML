import { gql } from "@apollo/client";

export const CHANGE_CUSTOMER_PASSWORD_MUTATION = gql`
  mutation ChangeCustomerPassword($currentPassword: String!, $newPassword: String!) {
    changeCustomerPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      id
      email
      firstname
      lastname
    }
  }
`;

export type ChangeCustomerPasswordVariables = {
  readonly currentPassword: string;
  readonly newPassword: string;
};

export type ChangeCustomerPasswordResponse = {
  changeCustomerPassword: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
};
