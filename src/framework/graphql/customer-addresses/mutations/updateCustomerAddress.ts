import { gql } from "@apollo/client";
import type {
  CreateCustomerAddressInput,
  CreateCustomerAddressResponse,
} from "./createCustomerAddress";

export const UPDATE_CUSTOMER_ADDRESS_MUTATION = gql`
  mutation UpdateCustomerAddress($id: Int!, $input: CustomerAddressInput!) {
    updateCustomerAddress(id: $id, input: $input) {
      id
      country_code
      street
      telephone
      postcode
      city
      default_shipping
      default_billing
    }
  }
`;

export type UpdateCustomerAddressVariables = {
  readonly id: number;
  readonly input: CreateCustomerAddressInput & {
    readonly region?: {
      readonly region?: string;
      readonly region_code?: string;
      readonly region_id?: number;
    };
  };
};

export type UpdateCustomerAddressResponse = {
  updateCustomerAddress: CreateCustomerAddressResponse["createCustomerAddress"];
};
