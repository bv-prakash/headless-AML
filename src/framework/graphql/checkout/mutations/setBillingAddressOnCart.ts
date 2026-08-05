import { gql } from "@apollo/client";
import { CHECKOUT_CART_ADDRESS_CORE } from "../fragments";
import type { BillingAddressMutationInput, CartShippingAddressNode } from "../types";

export const SET_BILLING_ADDRESS_ON_CART = gql`
  mutation SetBillingAddressOnCart(
    $cartId: String!
    $billingAddress: BillingAddressInput!
  ) {
    setBillingAddressOnCart(
      input: { cart_id: $cartId, billing_address: $billingAddress }
    ) {
      cart {
        billing_address {
          ...CheckoutCartAddressCore
        }
      }
    }
  }
  ${CHECKOUT_CART_ADDRESS_CORE}
`;

export type SetBillingAddressVariables = {
  readonly cartId: string;
  readonly billingAddress: BillingAddressMutationInput;
};

export type SetBillingAddressResponse = {
  setBillingAddressOnCart: {
    cart: {
      billing_address?: CartShippingAddressNode | null;
    };
  };
};
