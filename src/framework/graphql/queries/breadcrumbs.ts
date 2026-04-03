import { magentoGraphqlFetch } from "@/src/framework/graphql/magentoGraphqlFetch";

export type BreadcrumbItem = {
  readonly category_id: number;
  readonly category_name: string;
  readonly category_url_path: string | null;
};

type CategoryBreadcrumbsResponse = {
  category?: {
    name?: string | null;
    url_path?: string | null;
    breadcrumbs?: readonly BreadcrumbItem[] | null;
  } | null;
};

const CATEGORY_BREADCRUMBS_QUERY = `
  query CategoryBreadcrumbs($categoryId: Int!) {
    category(id: $categoryId) {
      name
      url_path
      breadcrumbs {
        category_id
        category_name
        category_url_path
      }
    }
  }
`;

const DEFAULT_REVALIDATE_SECONDS = 300;

export async function getCategoryBreadcrumbs(
  categoryId: string,
): Promise<{
  name: string;
  urlPath: string;
  breadcrumbs: BreadcrumbItem[];
}> {
  const data = await magentoGraphqlFetch<CategoryBreadcrumbsResponse>(
    CATEGORY_BREADCRUMBS_QUERY,
    { categoryId: Number(categoryId) },
    { revalidate: DEFAULT_REVALIDATE_SECONDS },
  );

  return {
    name: data.category?.name ?? "",
    urlPath: data.category?.url_path ?? "",
    breadcrumbs: [...(data.category?.breadcrumbs ?? [])],
  };
}
