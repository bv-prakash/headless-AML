export const RELATED_PRODUCTS_FRAGMENT = `
  fragment RelatedProductsFields on ProductInterface {
    related_products {
      __typename
      id
      uid
      name
      sku
      url_key
      small_image { url label }
      short_description { html }
      price_range {
        minimum_price {
          final_price { value currency }
        }
      }
      stock_status
    }
    upsell_products {
      id
      uid
      name
      sku
      url_key
      small_image { url label }
      short_description { html }
      price_range {
        minimum_price {
          final_price { value currency }
        }
      }
      stock_status
    }
    crosssell_products {
      __typename
      id
      uid
      name
      sku
      url_key
      small_image { url label }
      short_description { html }
      price_range {
        minimum_price {
          final_price { value currency }
        }
      }
      stock_status
    }
  }
`;
