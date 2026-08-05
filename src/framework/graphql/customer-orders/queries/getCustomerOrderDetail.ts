import { gql } from "@apollo/client";

export const CUSTOMER_ORDER_DETAIL_QUERY = gql`
  query CustomerOrderDetailByNumber($orderNumber: String!) {
    customer {
      id
      firstname
      lastname
      orders(filter: { number: { eq: $orderNumber } }, pageSize: 1) {
        items {
          id
          number
          increment_id
          order_date
          status
          shipping_method
          carrier
          payment_methods {
            name
            type
          }
          total {
            subtotal {
              value
              currency
            }
            total_tax {
              value
              currency
            }
            total_shipping {
              value
              currency
            }
            grand_total {
              value
              currency
            }
          }
          billing_address {
            firstname
            lastname
            company
            street
            city
            region
            postcode
            country_code
            telephone
          }
          shipping_address {
            firstname
            lastname
            company
            street
            city
            region
            postcode
            country_code
            telephone
          }
          items {
            id
            product_name
            product_sku
            product_url_key
            quantity_ordered
            product_sale_price {
              value
              currency
            }
          }
          invoices {
            id
            number
            total {
              grand_total {
                value
                currency
              }
            }
          }
          shipments {
            id
            number
            tracking {
              title
              carrier
              number
            }
            items {
              id
              product_name
              product_sku
              quantity_shipped
            }
          }
          credit_memos {
            id
            number
            total {
              grand_total {
                value
                currency
              }
            }
          }
        }
      }
    }
  }
`;
