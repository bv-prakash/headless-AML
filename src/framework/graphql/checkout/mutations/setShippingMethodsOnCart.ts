import { gql } from "@apollo/client";
import { CHECKOUT_SELECTED_SHIPPING_METHOD } from "../fragments";
import type { SelectedShippingMethod } from "../types";

export const SET_SHIPPING_METHODS_ON_CART = gql`
  mutation SetShippingMethodsOnCart(
    $cartId: String!
    $shippingMethods: [ShippingMethodInput!]!
  ) {
    setShippingMethodsOnCart(
      input: { cart_id: $cartId, shipping_methods: $shippingMethods }
    ) {
      cart {
        shipping_addresses {
          selected_shipping_method {
            ...CheckoutSelectedShippingMethod
          }
        }
      }
    }
  }
  ${CHECKOUT_SELECTED_SHIPPING_METHOD}
`;

export type SetShippingMethodsVariables = {
  readonly cartId: string;
  readonly shippingMethods: readonly {
    readonly carrier_code: string;
    readonly method_code: string;
  }[];
};

export type SetShippingMethodsResponse = {
  setShippingMethodsOnCart: {
    cart: {
      shipping_addresses?: readonly {
        selected_shipping_method?: SelectedShippingMethod | null;
      }[];
    };
  };
};
