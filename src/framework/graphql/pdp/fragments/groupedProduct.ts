export const GROUPED_PRODUCT_FRAGMENT = `
  fragment GroupedProductFields on GroupedProduct {
    items {
      position
      qty
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
