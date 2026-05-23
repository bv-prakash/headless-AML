import { gql } from "@apollo/client";
import {
  CHECKOUT_AVAILABLE_PAYMENT_METHOD,
  CHECKOUT_AVAILABLE_SHIPPING_METHOD,
} from "../fragments";
import type { PaymentMethodQuote, ShippingMethodOnAddress } from "../types";

/** Combined fetch: shipping rates + payment methods (one round trip). */
export const CART_CHECKOUT_OPTIONS_QUERY = gql`
  query CartCheckoutOptions($cartId: String!) {
    cart(cart_id: $cartId) {
      id
      shipping_addresses {
        available_shipping_methods {
          ...CheckoutAvailableShippingMethod
        }
      }
      available_payment_methods {
        ...CheckoutAvailablePaymentMethod
      }
    }
  }
  ${CHECKOUT_AVAILABLE_SHIPPING_METHOD}
  ${CHECKOUT_AVAILABLE_PAYMENT_METHOD}
`;

export type CartCheckoutOptionsResponse = {
  cart: {
    readonly shipping_addresses?: readonly {
      readonly available_shipping_methods?: readonly ShippingMethodOnAddress[] | null;
    }[] | null;
    readonly available_payment_methods?: readonly PaymentMethodQuote[] | null;
  } | null;
};
