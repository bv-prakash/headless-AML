import { gql } from "@apollo/client";

export const SET_PAYMENT_METHOD_AND_PLACE_ORDER = gql`
  mutation SetPaymentMethodAndPlaceOrder(
    $cartId: String!
    $paymentMethod: PaymentMethodInput!
  ) {
    setPaymentMethodAndPlaceOrder(
      input: { cart_id: $cartId, payment_method: $paymentMethod }
    ) {
      order {
        order_id
      }
    }
  }
`;

export type SetPaymentMethodAndPlaceOrderVariables = {
  readonly cartId: string;
  readonly paymentMethod: { readonly code: string };
};

export type SetPaymentMethodAndPlaceOrderResponse = {
  setPaymentMethodAndPlaceOrder: {
    readonly order?: { readonly order_id: string | number } | null;
  };
};
