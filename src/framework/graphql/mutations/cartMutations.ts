import { gql } from "@apollo/client";

export const CREATE_EMPTY_CART_MUTATION = gql`
  mutation CreateEmptyCart {
    createEmptyCart
  }
`;

export const ADD_TO_CART_MUTATION = gql`
  mutation AddToCart($cartId: String!, $sku: String!, $quantity: Float!) {
    addSimpleProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [{ data: { quantity: $quantity, sku: $sku } }]
      }
    ) {
      cart {
        total_quantity
        items {
          id
          product {
            sku
            name
            small_image {
              url
            }
          }
          quantity
          prices {
            row_total {
              value
              currency
            }
          }
        }
        prices {
          grand_total {
            value
            currency
          }
          subtotal_excluding_tax {
            value
            currency
          }
        }
      }
    }
  }
`;

export const CART_QUERY = gql`
  query Cart($cartId: String!) {
    cart(cart_id: $cartId) {
      total_quantity
      items {
        id
        product {
          sku
          name
          small_image {
            url
          }
        }
        quantity
        prices {
          row_total {
            value
            currency
          }
        }
      }
      prices {
        grand_total {
          value
          currency
        }
        subtotal_excluding_tax {
          value
          currency
        }
      }
    }
  }
`;

export const REMOVE_CART_ITEM_MUTATION = gql`
  mutation RemoveCartItem($cartId: String!, $cartItemId: Int!) {
    removeItemFromCart(input: { cart_id: $cartId, cart_item_id: $cartItemId }) {
      cart {
        total_quantity
        items {
          id
          product {
            sku
            name
            small_image {
              url
            }
          }
          quantity
          prices {
            row_total {
              value
              currency
            }
          }
        }
        prices {
          grand_total {
            value
            currency
          }
          subtotal_excluding_tax {
            value
            currency
          }
        }
      }
    }
  }
`;

export const UPDATE_CART_ITEM_MUTATION = gql`
  mutation UpdateCartItem(
    $cartId: String!
    $cartItemId: Int!
    $quantity: Float!
  ) {
    updateCartItems(
      input: {
        cart_id: $cartId
        cart_items: [{ cart_item_id: $cartItemId, quantity: $quantity }]
      }
    ) {
      cart {
        total_quantity
        items {
          id
          product {
            sku
            name
            small_image {
              url
            }
          }
          quantity
          prices {
            row_total {
              value
              currency
            }
          }
        }
        prices {
          grand_total {
            value
            currency
          }
          subtotal_excluding_tax {
            value
            currency
          }
        }
      }
    }
  }
`;

export type CartItemPrice = {
  readonly value: number;
  readonly currency: string;
};

export type CartItem = {
  readonly id: string;
  readonly product: {
    readonly sku: string;
    readonly name: string;
    readonly small_image?: { readonly url?: string | null } | null;
  };
  readonly quantity: number;
  readonly prices: {
    readonly row_total: CartItemPrice;
  };
};

export type CartPrices = {
  readonly grand_total: CartItemPrice;
  readonly subtotal_excluding_tax: CartItemPrice;
};

export type CartData = {
  readonly total_quantity: number;
  readonly items: readonly CartItem[];
  readonly prices: CartPrices;
};

export type AddToCartVariables = {
  readonly cartId: string;
  readonly sku: string;
  readonly quantity: number;
};

export type AddToCartResponse = {
  addSimpleProductsToCart: {
    cart: CartData;
  };
};

export type CartQueryVariables = {
  readonly cartId: string;
};

export type CartQueryResponse = {
  cart: CartData;
};

export type RemoveCartItemVariables = {
  readonly cartId: string;
  readonly cartItemId: number;
};

export type RemoveCartItemResponse = {
  removeItemFromCart: {
    cart: CartData;
  };
};

export type UpdateCartItemVariables = {
  readonly cartId: string;
  readonly cartItemId: number;
  readonly quantity: number;
};

export type UpdateCartItemResponse = {
  updateCartItems: {
    cart: CartData;
  };
};

export type CreateEmptyCartResponse = {
  createEmptyCart: string;
};
