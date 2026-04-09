import { gql } from "@apollo/client";

export const CART_BODY = `
  id
  total_quantity
  items {
    uid
    product {
      uid
      sku
      name
      url_key
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
    ... on ConfigurableCartItem {
      configurable_options {
        option_label
        value_label
      }
    }
    ... on BundleCartItem {
      bundle_options {
        uid
        label
        type
        values {
          id
          label
          price
          quantity
        }
      }
    }
    ... on DownloadableCartItem {
      links {
        title
        price
      }
      samples {
        title
        sample_url
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
`;

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
        ${CART_BODY}
      }
    }
  }
`;

export const CART_QUERY = gql`
  query Cart($cartId: String!) {
    cart(cart_id: $cartId) {
      ${CART_BODY}
    }
  }
`;

/** Logged-in customer’s active cart (requires `X-Customer-Token`). */
export const CUSTOMER_CART_QUERY = gql`
  query CustomerCart {
    customerCart {
      ${CART_BODY}
    }
  }
`;

/** Merge guest cart into the customer cart after login (requires customer token). */
export const MERGE_CARTS_MUTATION = gql`
  mutation MergeCarts($source_cart_id: String!) {
    mergeCarts(source_cart_id: $source_cart_id) {
      ${CART_BODY}
    }
  }
`;

export const REMOVE_CART_ITEM_MUTATION = gql`
  mutation RemoveCartItem($cartId: String!, $cartItemUid: ID!) {
    removeItemFromCart(input: { cart_id: $cartId, cart_item_uid: $cartItemUid }) {
      cart {
        ${CART_BODY}
      }
    }
  }
`;

export const UPDATE_CART_ITEM_MUTATION = gql`
  mutation UpdateCartItem($cartId: String!, $cartItemUid: ID!, $quantity: Float!) {
    updateCartItems(
      input: {
        cart_id: $cartId
        cart_items: [{ cart_item_uid: $cartItemUid, quantity: $quantity }]
      }
    ) {
      cart {
        ${CART_BODY}
      }
    }
  }
`;

export const ADD_CONFIGURABLE_TO_CART_MUTATION = gql`
  mutation AddConfigurableToCart(
    $cartId: String!
    $parentSku: String!
    $variantSku: String!
    $quantity: Float!
  ) {
    addConfigurableProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [
          {
            parent_sku: $parentSku
            data: { sku: $variantSku, quantity: $quantity }
          }
        ]
      }
    ) {
      cart {
        ${CART_BODY}
      }
    }
  }
`;

export const ADD_BUNDLE_TO_CART_MUTATION = gql`
  mutation AddBundleToCart(
    $cartId: String!
    $sku: String!
    $quantity: Float!
    $bundleOptions: [BundleOptionInput!]!
  ) {
    addBundleProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [
          {
            data: { sku: $sku, quantity: $quantity }
            bundle_options: $bundleOptions
          }
        ]
      }
    ) {
      cart {
        ${CART_BODY}
      }
    }
  }
`;

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
        ${CART_BODY}
      }
    }
  }
`;

export const ADD_VIRTUAL_TO_CART_MUTATION = gql`
  mutation AddVirtualToCart($cartId: String!, $sku: String!, $quantity: Float!) {
    addVirtualProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [{ data: { sku: $sku, quantity: $quantity } }]
      }
    ) {
      cart {
        ${CART_BODY}
      }
    }
  }
`;

export const ADD_GROUPED_TO_CART_MUTATION = gql`
  mutation AddGroupedToCart($cartId: String!, $cartItems: [SimpleProductCartItemInput!]!) {
    addSimpleProductsToCart(input: { cart_id: $cartId, cart_items: $cartItems }) {
      cart {
        ${CART_BODY}
      }
    }
  }
`;

export type CartItemPrice = {
  readonly value: number;
  readonly currency: string;
};

export type ConfigurableCartOption = {
  readonly option_label: string;
  readonly value_label: string;
};

export type BundleCartOptionValue = {
  readonly id: number;
  readonly label: string;
  readonly price: number;
  readonly quantity: number;
};

export type BundleCartOption = {
  readonly uid: string;
  readonly label: string;
  readonly type: string;
  readonly values: readonly BundleCartOptionValue[];
};

export type DownloadableCartLink = {
  readonly title: string;
  readonly price: number;
};

export type DownloadableCartSample = {
  readonly title: string;
  readonly sample_url: string;
};

export type CartItem = {
  readonly uid: string;
  readonly product: {
    readonly sku: string;
    readonly name: string;
    readonly url_key: string;
    readonly small_image?: { readonly url?: string | null } | null;
  } | null;
  readonly quantity: number;
  readonly prices: {
    readonly row_total: CartItemPrice;
  } | null;
  readonly configurable_options?: readonly ConfigurableCartOption[];
  readonly bundle_options?: readonly BundleCartOption[];
  readonly links?: readonly DownloadableCartLink[];
  readonly samples?: readonly DownloadableCartSample[];
};

export type CartPrices = {
  readonly grand_total: CartItemPrice;
  readonly subtotal_excluding_tax: CartItemPrice;
};

export type CartData = {
  /** Masked cart id (returned by cart queries/mutations). */
  readonly id?: string;
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

export type CustomerCartQueryResponse = {
  customerCart: CartData;
};

export type MergeCartsVariables = {
  readonly source_cart_id: string;
};

export type MergeCartsResponse = {
  mergeCarts: CartData;
};

export type RemoveCartItemVariables = {
  readonly cartId: string;
  readonly cartItemUid: string;
};

export type RemoveCartItemResponse = {
  removeItemFromCart: {
    cart: CartData;
  };
};

export type UpdateCartItemVariables = {
  readonly cartId: string;
  readonly cartItemUid: string;
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

export type AddConfigurableToCartVariables = {
  readonly cartId: string;
  readonly parentSku: string;
  readonly variantSku: string;
  readonly quantity: number;
};

export type AddConfigurableToCartResponse = {
  addConfigurableProductsToCart: {
    cart: CartData;
  };
};

export type BundleOptionInput = {
  readonly id: number;
  readonly quantity: number;
  readonly value: readonly string[];
};

export type AddBundleToCartVariables = {
  readonly cartId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly bundleOptions: readonly BundleOptionInput[];
};

export type AddBundleToCartResponse = {
  addBundleProductsToCart: {
    cart: CartData;
  };
};

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

export type AddVirtualToCartVariables = {
  readonly cartId: string;
  readonly sku: string;
  readonly quantity: number;
};

export type AddVirtualToCartResponse = {
  addVirtualProductsToCart: {
    cart: CartData;
  };
};

export type GroupedCartItemInput = {
  readonly data: {
    readonly sku: string;
    readonly quantity: number;
  };
};

export type AddGroupedToCartVariables = {
  readonly cartId: string;
  readonly cartItems: readonly GroupedCartItemInput[];
};

export type AddGroupedToCartResponse = {
  addSimpleProductsToCart: {
    cart: CartData;
  };
};
