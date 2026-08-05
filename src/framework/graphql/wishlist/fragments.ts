/** Shared product fields for wishlist lines (ProductInterface). `uid`
 *  required for Apollo `SimpleProduct` keyFields. */
const WISHLIST_PRODUCT_FIELDS = `
  __typename
  uid
  sku
  name
  url_key
  small_image {
    url
  }
  price_range {
    minimum_price {
      regular_price {
        value
        currency
      }
    }
  }
`;

/**
 * Lines from `items_v2` (preferred) plus legacy `items` (uses `qty`).
 * Some stores/API versions return an empty `items_v2.items` array while
 * `items` is populated.
 */
export const WISHLIST_LIST_BODY = `
  id
  items_count
  items_v2(pageSize: 100, currentPage: 1) {
    items {
      id
      quantity
      product {
        ${WISHLIST_PRODUCT_FIELDS}
      }
    }
  }
  items {
    id
    qty
    product {
      ${WISHLIST_PRODUCT_FIELDS}
    }
  }
`;
