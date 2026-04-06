import { gql } from "@apollo/client";

export const COMPARE_LIST_QUERY = gql`
  query CompareList($uid: ID!) {
    compareList(uid: $uid) {
      uid
      item_count
      attributes {
        code
        label
      }
      items {
        uid
        product {
          sku
          name
          url_key
          description {
            html
          }
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
        }
      }
    }
  }
`;

export const CREATE_COMPARE_LIST_MUTATION = gql`
  mutation CreateCompareList($products: [ID]!) {
    createCompareList(input: { products: $products }) {
      uid
      item_count
      items {
        uid
        product {
          sku
          name
        }
      }
    }
  }
`;

export const ADD_TO_COMPARE_LIST_MUTATION = gql`
  mutation AddToCompareList($uid: ID!, $products: [ID]!) {
    addProductsToCompareList(input: { uid: $uid, products: $products }) {
      uid
      item_count
      items {
        uid
        product {
          sku
          name
        }
      }
    }
  }
`;

export const REMOVE_FROM_COMPARE_LIST_MUTATION = gql`
  mutation RemoveFromCompareList($uid: ID!, $products: [ID]!) {
    removeProductsFromCompareList(input: { uid: $uid, products: $products }) {
      uid
      item_count
      items {
        uid
        product {
          sku
          name
        }
      }
    }
  }
`;

export type CompareMutationResult = {
  readonly uid: string;
  readonly item_count: number;
  readonly items: readonly { readonly uid: string; readonly product: { readonly sku: string; readonly name: string } }[];
};

export type CreateCompareListResponse = {
  createCompareList: CompareMutationResult;
};

export type CreateCompareListVariables = {
  readonly products: readonly number[];
};

export type AddToCompareListResponse = {
  addProductsToCompareList: CompareMutationResult;
};

export type AddToCompareListVariables = {
  readonly uid: string;
  readonly products: readonly number[];
};

export type RemoveFromCompareListResponse = {
  removeProductsFromCompareList: CompareMutationResult;
};

export type RemoveFromCompareListVariables = {
  readonly uid: string;
  readonly products: readonly string[];
};

export type CompareAttribute = {
  readonly code: string;
  readonly label: string;
};

export type CompareProductItem = {
  readonly uid: string;
  readonly product: {
    readonly sku: string;
    readonly name: string;
    readonly url_key?: string;
    readonly description?: { readonly html?: string } | null;
    readonly small_image?: { readonly url?: string | null } | null;
    readonly price_range?: {
      readonly minimum_price?: {
        readonly regular_price?: {
          readonly value?: number | null;
          readonly currency?: string | null;
        } | null;
      } | null;
    } | null;
  };
};

export type CompareListData = {
  readonly uid: string;
  readonly item_count: number;
  readonly attributes: readonly CompareAttribute[];
  readonly items: readonly CompareProductItem[];
};

export type CompareListQueryResponse = {
  compareList: CompareListData | null;
};

export type CompareListQueryVariables = {
  uid: string;
};
