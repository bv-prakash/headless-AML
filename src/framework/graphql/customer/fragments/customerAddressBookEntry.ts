/** One saved address row for `customer.addresses` (checkout picker). */
export const CUSTOMER_ADDRESS_BOOK_ENTRY = `
  fragment CustomerAddressBookEntry on CustomerAddress {
    id
    default_shipping
    default_billing
    firstname
    lastname
    street
    city
    region {
      region_id
      region_code
      region
    }
    postcode
    country_code
    telephone
  }
`;
