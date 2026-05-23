export const COMMON_PRODUCT_FRAGMENT = `
  fragment CommonProductFields on ProductInterface {
    __typename
    id
    uid
    name
    sku
    url_key

    meta_title
    meta_description

    description { html }
    short_description { html }

    image { url label }
    media_gallery {
      url
      label
      position
    }

    price_range {
      minimum_price {
        regular_price { value currency }
        final_price { value currency }
        discount {
          percent_off
          amount_off
        }
      }
    }

    stock_status
    only_x_left_in_stock

    categories {
      id
      name
      url_path
    }

    review_count
    rating_summary
  }
`;
