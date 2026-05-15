import { gql } from "@apollo/client";
import { CART_BODY } from "@/src/framework/graphql/mutations/cartMutations";
import type { CartData } from "@/src/framework/graphql/mutations/cartMutations";
import {
  CHECKOUT_AVAILABLE_PAYMENT_METHOD,
  CHECKOUT_AVAILABLE_SHIPPING_METHOD,
  CHECKOUT_CART_ADDRESS_CORE,
  CHECKOUT_SELECTED_PAYMENT_METHOD,
  CHECKOUT_SELECTED_SHIPPING_METHOD,
} from "@/src/framework/graphql/fragments/checkoutCart";

/** Cart lines + totals for steps that need full cart (payment method, etc.). */
export const CHECKOUT_CART_BODY = `
  ${CART_BODY}
`;

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

export const SET_GUEST_EMAIL_ON_CART = gql`
  mutation SetGuestEmailOnCart($cartId: String!, $email: String!) {
    setGuestEmailOnCart(input: { cart_id: $cartId, email: $email }) {
      cart {
        email
      }
    }
  }
`;

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

export const PLACE_ORDER = gql`
  mutation PlaceOrder($cartId: String!) {
    placeOrder(input: { cart_id: $cartId }) {
      orderV2 {
        number
      }
      errors {
        message
        code
      }
    }
  }
`;

export type RegionCountryLabel = {
  readonly code?: string | null;
  readonly label?: string | null;
};

export type MoneyAmount = {
  readonly value: number;
  readonly currency: string;
};

export type ShippingMethodOnAddress = {
  readonly carrier_code: string;
  readonly method_code: string;
  readonly carrier_title?: string | null;
  readonly method_title?: string | null;
  readonly amount?: MoneyAmount | null;
};

export type CartShippingAddressNode = {
  readonly firstname?: string | null;
  readonly lastname?: string | null;
  readonly company?: string | null;
  readonly street?: readonly string[] | null;
  readonly city?: string | null;
  readonly region?: RegionCountryLabel | null;
  readonly postcode?: string | null;
  readonly telephone?: string | null;
  readonly country?: RegionCountryLabel | null;
  readonly available_shipping_methods?: readonly ShippingMethodOnAddress[] | null;
};

export type SelectedShippingMethod = {
  readonly carrier_code: string;
  readonly method_code: string;
  readonly carrier_title?: string | null;
  readonly method_title?: string | null;
};

export type SetShippingAddressesResponse = {
  setShippingAddressesOnCart: {
    cart: {
      shipping_addresses?: readonly CartShippingAddressNode[] | null;
    };
  };
};

export type PaymentMethodQuote = {
  readonly code: string;
  readonly title: string;
};

export type CheckoutPaymentMethodsResponse = {
  cart: {
    available_payment_methods?: readonly PaymentMethodQuote[] | null;
  } | null;
};

export type SetShippingAddressesVariables = {
  readonly cartId: string;
  readonly shippingAddresses: readonly ShippingAddressInput[];
};

/** Magento `CartAddressInput` for mutations. */
export type CartAddressInput = {
  readonly firstname: string;
  readonly lastname: string;
  readonly company?: string;
  readonly street: readonly string[];
  readonly city: string;
  readonly region: string;
  readonly region_id?: number;
  readonly postcode: string;
  readonly country_code: string;
  readonly telephone: string;
  readonly save_in_address_book?: boolean;
};

/** Pass either `address` or `customer_address_id` (saved address from address book). */
export type ShippingAddressInput = {
  readonly address?: CartAddressInput;
  readonly customer_address_id?: number;
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

export type SetShippingMethodsVariables = {
  readonly cartId: string;
  readonly shippingMethods: readonly {
    readonly carrier_code: string;
    readonly method_code: string;
  }[];
};

export type SetBillingAddressResponse = {
  setBillingAddressOnCart: {
    cart: {
      billing_address?: CartShippingAddressNode | null;
    };
  };
};

export type BillingAddressMutationInput = {
  readonly address?: CartAddressInput;
  readonly same_as_shipping?: boolean;
  readonly customer_address_id?: number;
};

export type SetBillingAddressVariables = {
  readonly cartId: string;
  readonly billingAddress: BillingAddressMutationInput;
};

export type SetGuestEmailResponse = {
  setGuestEmailOnCart: {
    cart: { email?: string | null };
  };
};

export type SetGuestEmailVariables = {
  readonly cartId: string;
  readonly email: string;
};

export type CheckoutCartData = CartData;

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

export type CartCheckoutOptionsResponse = {
  cart: {
    readonly shipping_addresses?: readonly {
      readonly available_shipping_methods?: readonly ShippingMethodOnAddress[] | null;
    }[] | null;
    readonly available_payment_methods?: readonly PaymentMethodQuote[] | null;
  } | null;
};

export type SetPaymentMethodAndPlaceOrderResponse = {
  setPaymentMethodAndPlaceOrder: {
    readonly order?: { readonly order_id: string | number } | null;
  };
};

export type SetPaymentMethodAndPlaceOrderVariables = {
  readonly cartId: string;
  readonly paymentMethod: { readonly code: string };
};

export type SetPaymentMethodVariables = {
  readonly cartId: string;
  readonly paymentMethod: { readonly code: string };
};

export type PlaceOrderError = {
  readonly message: string;
  readonly code?: string | null;
};

export type PlaceOrderResponse = {
  placeOrder: {
    readonly orderV2: { readonly number: string } | null;
    readonly errors?: readonly PlaceOrderError[] | null;
  };
};

export type PlaceOrderVariables = {
  readonly cartId: string;
};
