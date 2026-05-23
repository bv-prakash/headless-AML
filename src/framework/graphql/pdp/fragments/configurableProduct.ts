export const CONFIGURABLE_PRODUCT_FRAGMENT = `
  fragment ConfigurableProductFields on ConfigurableProduct {
    configurable_options {
      attribute_code
      label
      values {
        value_index
        label
        uid
      }
    }
    variants {
      attributes {
        code
        value_index
      }
      product {
        id
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
`;
