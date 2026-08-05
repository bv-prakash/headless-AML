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

export type PaymentMethodQuote = {
  readonly code: string;
  readonly title: string;
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

export type BillingAddressMutationInput = {
  readonly address?: CartAddressInput;
  readonly same_as_shipping?: boolean;
  readonly customer_address_id?: number;
};

export type PlaceOrderError = {
  readonly message: string;
  readonly code?: string | null;
};
