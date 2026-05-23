import { gql } from "@apollo/client";
import { CUSTOMER_ADDRESS_BOOK_ENTRY } from "../fragments/customerAddressBookEntry";

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
