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

const CATEGORY_CHILDREN_QUERY = `
  query CategoryChildren($parentId: String!) {
    categoryList(filters: { ids: { eq: $parentId } }) {
      id
      uid
      children {
        id
        uid
        name
        url_path
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

export type CategoryChildSimple = {
  readonly id: number;
  readonly uid: string;
  readonly name: string;
  readonly url_path: string | null;
};

type CategoryChildrenResponse = {
  categoryList?: readonly {
    id: number;
    uid: string;
    children?: readonly CategoryChildSimple[];
  }[] | null;
};

export async function getCategoryChildren(
  parentId: string,
): Promise<{
  parentUid: string;
  children: readonly CategoryChildSimple[];
}> {
  const data = await magentoGraphqlFetch<CategoryChildrenResponse>(
    CATEGORY_CHILDREN_QUERY,
    { parentId },
    { revalidate: DEFAULT_REVALIDATE_SECONDS },
  );

  const parent = data.categoryList?.[0];
  return {
    parentUid: parent?.uid ?? "",
    children: parent?.children ?? [],
  };
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
