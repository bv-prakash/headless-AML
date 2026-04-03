export { default as apolloClient } from "./apolloClient";

export {
  getFooterLeftCmsBlock,
  getFooterServiceCmsBlock,
  getFooterSocialCmsBlock,
} from "./queries/footerGraphql";

export { getStoreLogo } from "./queries/storeLogo";

export { getHomePage } from "./queries/home";

export {
  getProductsByCategory,
  parseProductListSortParam,
  parseFacetSearchParams,
  FACET_PARAM_PREFIX,
} from "./queries/products";
export type { ProductListSortKey, ProductAggregation } from "./queries/products";
