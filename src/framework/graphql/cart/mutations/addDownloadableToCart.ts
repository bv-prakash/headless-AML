import { gql } from "@apollo/client";
import { CART_ADD_RESPONSE_BODY } from "../fragments";
import type { CartData } from "../types";

export const ADD_DOWNLOADABLE_TO_CART_MUTATION = gql`
  mutation AddDownloadableToCart(
    $cartId: String!
    $sku: String!
    $quantity: Float!
    $links: [DownloadableProductLinksInput!]!
  ) {
    addDownloadableProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: {
          data: { sku: $sku, quantity: $quantity }
          downloadable_product_links: $links
        }
      }
    ) {
      cart {
        ${CART_ADD_RESPONSE_BODY}
      }
    }
  }
`;

export type DownloadableLinkInput = {
  readonly link_id: number;
};

export type AddDownloadableToCartVariables = {
  readonly cartId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly links: readonly DownloadableLinkInput[];
};

export type AddDownloadableToCartResponse = {
  addDownloadableProductsToCart: {
    cart: CartData;
  };
};
