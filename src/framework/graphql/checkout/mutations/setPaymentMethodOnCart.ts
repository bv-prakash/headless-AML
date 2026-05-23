import { gql } from "@apollo/client";
import { CHECKOUT_SELECTED_PAYMENT_METHOD } from "../fragments";

export const SET_PAYMENT_METHOD_ON_CART = gql`
  mutation SetPaymentMethodOnCart(
    $cartId: String!
    $paymentMethod: PaymentMethodInput!
  ) {
    setPaymentMethodOnCart(
      input: { cart_id: $cartId, payment_method: $paymentMethod }
    ) {
      cart {
        selected_payment_method {
          ...CheckoutSelectedPaymentMethod
        }
      }
    }
  }
  ${CHECKOUT_SELECTED_PAYMENT_METHOD}
`;

export type SetPaymentMethodVariables = {
  readonly cartId: string;
  readonly paymentMethod: { readonly code: string };
};

export type SetPaymentMethodResponse = {
  setPaymentMethodOnCart: {
    cart: {
      selected_payment_method?: {
        readonly code: string;
        readonly title: string;
      } | null;
    };
  };
};
