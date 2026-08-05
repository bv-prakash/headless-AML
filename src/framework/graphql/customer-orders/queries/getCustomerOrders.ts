import { gql } from "@apollo/client";

/** Customer order list (newest first). Pagination via `$currentPage` / `$pageSize`. */
export const CUSTOMER_ORDERS_QUERY = gql`
  query CustomerOrdersList($currentPage: Int!, $pageSize: Int!) {
    customer {
      id
      firstname
      lastname
      orders(
        pageSize: $pageSize
        currentPage: $currentPage
        sort: { sort_field: CREATED_AT, sort_direction: DESC }
      ) {
        total_count
        items {
          id
          number
          increment_id
          order_date
          status
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
`;
