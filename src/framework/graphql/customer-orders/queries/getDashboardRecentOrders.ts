import { gql } from "@apollo/client";

/** Account dashboard: latest orders (Luma `block-dashboard-orders`). */
export const CUSTOMER_DASHBOARD_RECENT_ORDERS_QUERY = gql`
  query CustomerDashboardRecentOrders {
    customer {
      id
      firstname
      lastname
      orders(
        pageSize: 5
        currentPage: 1
        sort: { sort_field: CREATED_AT, sort_direction: DESC }
      ) {
        items {
          id
          number
          increment_id
          order_date
          status
          billing_address {
            firstname
            lastname
          }
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
