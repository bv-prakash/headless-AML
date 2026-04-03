import { magentoGraphqlFetch } from "@/src/framework/graphql/magentoGraphqlFetch";

export type CategoryChild = {
  readonly id: number;
  readonly name: string;
  readonly url_path: string | null;
  readonly children?: readonly CategoryChild[];
};

export type CategoryListItem = {
  readonly id: number;
  readonly name: string;
  readonly children_count: number;
  readonly children?: readonly CategoryChild[];
};

type CategoryListResponse = {
  categoryList?: readonly CategoryListItem[] | null;
};

const CATEGORY_LIST_QUERY = `
  query CategoryList($rootId: String!) {
    categoryList(filters: { ids: { eq: $rootId } }) {
      id
      name
      children_count
      children {
        id
        name
        url_path
        children {
          id
          name
          url_path
          children {
            id
            name
            url_path
          }
        }
      }
    }
  }
`;

const CATEGORY_BY_URL_PATH_QUERY = `
  query CategoryByUrlPath($urlPath: String!) {
    categoryList(filters: { url_path: { eq: $urlPath } }) {
      id
      name
      url_path
    }
  }
`;

const DEFAULT_REVALIDATE_SECONDS = 600;

export async function getCategoryList(
  rootId: string = "2",
): Promise<readonly CategoryListItem[]> {
  const data = await magentoGraphqlFetch<CategoryListResponse>(
    CATEGORY_LIST_QUERY,
    { rootId },
    { revalidate: DEFAULT_REVALIDATE_SECONDS },
  );

  return data.categoryList ?? [];
}

export async function getCategoryByUrlPath(
  urlPath: string,
): Promise<{ id: number; name: string; urlPath: string } | null> {
  const data = await magentoGraphqlFetch<CategoryListResponse>(
    CATEGORY_BY_URL_PATH_QUERY,
    { urlPath },
    { revalidate: DEFAULT_REVALIDATE_SECONDS },
  );

  const cat = data.categoryList?.[0];
  if (!cat) return null;

  return {
    id: cat.id,
    name: cat.name,
    urlPath: (cat as unknown as { url_path: string }).url_path ?? "",
  };
}
