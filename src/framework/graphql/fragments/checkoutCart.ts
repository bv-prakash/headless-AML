/**
 * Shared GraphQL fragments for checkout (cart address shapes, shipping rates, payment methods).
 * Compose these in mutations/queries so field lists stay DRY and stay in sync.
 */

/** Postal + region/country block for any `CartAddressInterface` (shipping or billing on the quote). */
export const CHECKOUT_CART_ADDRESS_CORE = `
  fragment CheckoutCartAddressCore on CartAddressInterface {
    firstname
    lastname
    company
    street
    city
    region {
      code
      label
    }
    postcode
    telephone
    country {
      code
      label
    }
  }
`;

/** One carrier/method line from `available_shipping_methods`. */
export const CHECKOUT_AVAILABLE_SHIPPING_METHOD = `
  fragment CheckoutAvailableShippingMethod on AvailableShippingMethod {
    carrier_code
    carrier_title
    method_code
    method_title
    amount {
      value
      currency
    }
  }
`;

/** Currently chosen rate on the shipping address. */
export const CHECKOUT_SELECTED_SHIPPING_METHOD = `
  fragment CheckoutSelectedShippingMethod on SelectedShippingMethod {
    carrier_code
    method_code
    carrier_title
    method_title
  }
`;

/** Row from `cart.available_payment_methods`. */
export const CHECKOUT_AVAILABLE_PAYMENT_METHOD = `
  fragment CheckoutAvailablePaymentMethod on AvailablePaymentMethod {
    code
    title
  }
`;

/** Row from `cart.selected_payment_method` after `setPaymentMethodOnCart`. */
export const CHECKOUT_SELECTED_PAYMENT_METHOD = `
  fragment CheckoutSelectedPaymentMethod on SelectedPaymentMethod {
    code
    title
  }
`;
