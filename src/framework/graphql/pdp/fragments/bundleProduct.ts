export const BUNDLE_PRODUCT_FRAGMENT = `
  fragment BundleProductFields on BundleProduct {
    items {
      option_id
      title
      required
      type
      options {
        id
        label
        quantity
        product {
          sku
          name
          stock_status
          price_range {
            minimum_price {
              final_price { value currency }
            }
          }
        }
      }
    }
  }
`;
