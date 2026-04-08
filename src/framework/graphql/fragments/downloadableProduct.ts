export const DOWNLOADABLE_PRODUCT_FRAGMENT = `
  fragment DownloadableProductFields on DownloadableProduct {
    downloadable_product_links {
      id
      title
      price
      sample_url
    }
    downloadable_product_samples {
      title
      sample_url
    }
  }
`;
