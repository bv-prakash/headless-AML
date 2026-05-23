import {
  magentoGraphqlFetch,
  MagentoGraphqlError,
} from "@/src/framework/graphql/magentoGraphqlFetch";

export type BreadcrumbItem = {
  readonly category_id: number;
  readonly category_name: string;
  readonly category_url_path: string | null;
};

/** Resolved category trail for PLP/PDP headers — pass from the page to avoid duplicate GraphQL. */
export type CategoryBreadcrumbsData = {
  readonly name: string;
  readonly urlPath: string;
  readonly breadcrumbs: readonly BreadcrumbItem[];
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

/** Breadcrumbs rarely change per store view; 10 min cache absorbs PLP bursts. */
const BREADCRUMBS_CACHE_TTL_MS = 10 * 60 * 1000;

const EMPTY_BREADCRUMBS: CategoryBreadcrumbsData = {
  name: "",
  urlPath: "",
  breadcrumbs: [],
};

export async function getCategoryBreadcrumbs(
  categoryId: string,
  options: { storeViewCode?: string } = {},
): Promise<CategoryBreadcrumbsData> {
  const trimmedCode = options.storeViewCode?.trim();
  try {
    const data = await magentoGraphqlFetch<CategoryBreadcrumbsResponse>(
      CATEGORY_BREADCRUMBS_QUERY,
      { categoryId: Number(categoryId) },
      {
        ...(trimmedCode ? { storeViewCode: trimmedCode } : {}),
        cacheTtlMs: BREADCRUMBS_CACHE_TTL_MS,
        serveStaleOnError: true,
      },
    );

    return {
      name: data.category?.name ?? "",
      urlPath: data.category?.url_path ?? "",
      breadcrumbs: [...(data.category?.breadcrumbs ?? [])],
    };
  } catch (err) {
    if (err instanceof MagentoGraphqlError && err.isPhpFatal) {
      return EMPTY_BREADCRUMBS;
    }
    throw err;
  }
}
