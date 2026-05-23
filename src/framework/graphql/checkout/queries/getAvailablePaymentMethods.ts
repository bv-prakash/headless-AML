import { gql } from "@apollo/client";
import type { PaymentMethodQuote } from "../types";

/** Active payment methods Magento exposes for the quote. */
export const CHECKOUT_AVAILABLE_PAYMENT_METHODS_QUERY = gql`
  query CheckoutAvailablePaymentMethods($cartId: String!) {
    cart(cart_id: $cartId) {
      id
      available_payment_methods {
        code
        title
      }
    }
  }
`;

export type CheckoutPaymentMethodsResponse = {
  cart: {
    available_payment_methods?: readonly PaymentMethodQuote[] | null;
  } | null;
};
