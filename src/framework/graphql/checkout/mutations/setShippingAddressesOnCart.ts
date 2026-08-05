import { gql } from "@apollo/client";
import type { CartShippingAddressNode, ShippingAddressInput } from "../types";

export const SET_SHIPPING_ADDRESSES_ON_CART = gql`
  mutation SetShippingAddressesOnCart(
    $cartId: String!
    $shippingAddresses: [ShippingAddressInput!]!
  ) {
    setShippingAddressesOnCart(
      input: { cart_id: $cartId, shipping_addresses: $shippingAddresses }
    ) {
      cart {
        id
      }
    }
  }
`;

export type SetShippingAddressesVariables = {
  readonly cartId: string;
  readonly shippingAddresses: readonly ShippingAddressInput[];
};

export type SetShippingAddressesResponse = {
  setShippingAddressesOnCart: {
    cart: {
      shipping_addresses?: readonly CartShippingAddressNode[] | null;
    };
  };
};
