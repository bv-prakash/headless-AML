/** @see https://developer.adobe.com/commerce/webapi/graphql/ — Orders mutations (`reorderItems`). */
import { gql } from "@apollo/client";
import { CART_BODY } from "@/src/framework/graphql/cart/fragments";
import type { CartData } from "@/src/framework/graphql/cart/types";

export const REORDER_ITEMS_MUTATION = gql`
  mutation ReorderItems($orderNumber: String!) {
    reorderItems(orderNumber: $orderNumber) {
      cart {
        ${CART_BODY}
      }
      userInputErrors {
        message
      }
    }
  }
`;

export type ReorderItemsVariables = {
  readonly orderNumber: string;
};

export type ReorderItemsResponse = {
  reorderItems: {
    cart: CartData;
    userInputErrors: readonly { readonly message: string }[];
  };
};
