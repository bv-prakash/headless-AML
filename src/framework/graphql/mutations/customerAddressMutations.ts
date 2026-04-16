import { gql } from "@apollo/client";

/**
 * Requires a **customer** Bearer token (`Authorization: Bearer …`).
 *
 * Minimal shape (no `region` in input) — Magento may still require `region` for some
 * countries; the checkout builder adds it when the form collects state/region.
 *
 * ```graphql
 * mutation {
 *   createCustomerAddress(input: {
 *     country_code: US
 *     street: ["123 Main Street"]
 *     telephone: "7777777777"
 *     postcode: "77777"
 *     city: "Phoenix"
 *     firstname: "Bob"
 *     lastname: "Loblaw"
 *     default_shipping: true
 *     default_billing: false
 *   }) {
 *     id
 *     country_code
 *     street
 *     telephone
 *     postcode
 *     city
 *     default_shipping
 *     default_billing
 *   }
 * }
 * ```
 */
export const CREATE_CUSTOMER_ADDRESS_MUTATION = gql`
  mutation CreateCustomerAddress($input: CustomerAddressInput!) {
    createCustomerAddress(input: $input) {
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

/** Matches the minimal GraphQL example; `region` is not part of this type (see checkout payload type in `addressHelpers`). */
export type CreateCustomerAddressInput = {
  readonly country_code: string;
  readonly street: readonly string[];
  readonly telephone: string;
  readonly postcode: string;
  readonly city: string;
  readonly firstname: string;
  readonly lastname: string;
  readonly company?: string;
  readonly default_shipping?: boolean;
  readonly default_billing?: boolean;
};

export type CreateCustomerAddressVariables = {
  readonly input: CreateCustomerAddressInput;
};

export type CreateCustomerAddressResponse = {
  createCustomerAddress: {
    readonly id: number;
    readonly country_code?: string | null;
    readonly street?: readonly string[] | null;
    readonly telephone?: string | null;
    readonly postcode?: string | null;
    readonly city?: string | null;
    readonly default_shipping?: boolean | null;
    readonly default_billing?: boolean | null;
  };
};

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
