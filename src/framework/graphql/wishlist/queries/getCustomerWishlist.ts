import { gql } from "@apollo/client";
import { WISHLIST_LIST_BODY } from "../fragments";

export const CUSTOMER_WISHLIST_QUERY = gql`
  query CustomerWishlist {
    customer {
      id
      wishlist {
        ${WISHLIST_LIST_BODY}
      }
    }
  }
`;
