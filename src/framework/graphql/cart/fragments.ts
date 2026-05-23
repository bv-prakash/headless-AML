/**
 * Inline GraphQL field-list fragments for the cart. These are plain
 * template strings (interpolated into `gql\`\``), not Apollo
 * `DocumentNode`-style named fragments — Magento queries compose
 * faster this way and Apollo doesn't need to register the fragment.
 *
 * `CART_BODY` and `CART_ADD_RESPONSE_BODY` must stay in sync — any
 * mutation that writes back into the `CART_QUERY` cache slot needs
 * the same fields or Apollo logs "Missing field 'configurable_options'".
 */

const CART_PRODUCT_FIELDS = `
  uid
  sku
  name
  url_key
  small_image {
    url
  }
`;

const CART_ITEM_PRICE_FIELDS = `
  row_total {
    value
    currency
  }
`;

const CART_ITEM_BASE_FIELDS = `
  uid
  product {
    ${CART_PRODUCT_FIELDS}
  }
  quantity
  prices {
    ${CART_ITEM_PRICE_FIELDS}
  }
`;

const CART_ITEM_TYPE_SPREADS = `
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
`;

const CART_PRICE_FIELDS = `
  grand_total {
    value
    currency
  }
  subtotal_excluding_tax {
    value
    currency
  }
`;

export const CART_BODY = `
  id
  total_quantity
  items {
    ${CART_ITEM_BASE_FIELDS}
    ${CART_ITEM_TYPE_SPREADS}
  }
  prices {
    ${CART_PRICE_FIELDS}
  }
`;

/**
 * Add-to-cart mutation response body. Mirrors `CART_BODY` exactly so
 * `writeCartQueryToCache` can merge mutation results into `CART_QUERY`'s
 * cache slot without Apollo logging missing fields.
 */
export const CART_ADD_RESPONSE_BODY = CART_BODY;
