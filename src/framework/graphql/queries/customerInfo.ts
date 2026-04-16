import { gql } from "@apollo/client";
import { CUSTOMER_ADDRESS_BOOK_ENTRY } from "@/src/framework/graphql/fragments/customerAddress";

/** Customer profile + address book for checkout (shipping / billing selection). */
export const CUSTOMER_INFO_QUERY = gql`
  query CustomerForCheckout {
    customer {
      id
      firstname
      lastname
      telephone
      suffix
      email
      is_subscribed
      addresses {
        ...CustomerAddressBookEntry
      }
    }
  }
  ${CUSTOMER_ADDRESS_BOOK_ENTRY}
`;

export type CustomerRegion = {
  readonly region_id?: number | null;
  readonly region_code?: string | null;
  readonly region?: string | null;
};

export type CustomerAddressNode = {
  readonly id: number;
  readonly default_shipping?: boolean | null;
  readonly default_billing?: boolean | null;
  readonly firstname?: string | null;
  readonly lastname?: string | null;
  readonly street?: readonly string[] | null;
  readonly city?: string | null;
  readonly region?: CustomerRegion | null;
  readonly postcode?: string | null;
  readonly country_code?: string | null;
  readonly telephone?: string | null;
};

export type CustomerForCheckoutData = {
  readonly id?: number | null;
  readonly firstname?: string | null;
  readonly lastname?: string | null;
  readonly telephone?: string | null;
  readonly suffix?: string | null;
  readonly email?: string | null;
  readonly is_subscribed?: boolean | null;
  readonly addresses?: readonly CustomerAddressNode[] | null;
};

export type CustomerForCheckoutResponse = {
  customer: CustomerForCheckoutData | null;
};
