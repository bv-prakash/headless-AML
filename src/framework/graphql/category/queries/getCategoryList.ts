import { getCategoryNavRootIdOverride } from "@/src/config/storeViews";
import { magentoGraphqlFetch } from "@/src/framework/graphql/magentoGraphqlFetch";
import { getStoreConfig } from "@/src/framework/graphql/store/queries/getStoreConfig";

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

/** Shared category-tree selection — kept in sync across `ids` / `category_uid` / `url_path` lookups. */
const CATEGORY_TREE_SELECTION = `
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
`;

const CATEGORY_LIST_QUERY = `
  query CategoryList($rootId: String!) {
    categoryList(filters: { ids: { eq: $rootId } }) {
      ${CATEGORY_TREE_SELECTION}
    }
  }
`;

const CATEGORY_LIST_BY_ROOT_UID_QUERY = `
  query CategoryListByRootUid($rootUid: String!) {
    categoryList(filters: { category_uid: { eq: $rootUid } }) {
      ${CATEGORY_TREE_SELECTION}
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
      uid
      name
      url_path
    }
  }
`;

/** Some stacks omit `uid` on `url_path` hits — `ids` lookup is reliable for PLP `category_uid` fallback. */
const CATEGORY_UID_BY_ENTITY_ID_QUERY = `
  query CategoryUidByEntityId($id: String!) {
    categoryList(filters: { ids: { eq: $id } }) {
      id
      uid
    }
  }
`;

/** Category tree rarely changes per store view — keep a 10 min cache, tolerate Magento blips. */
const CATEGORY_TREE_CACHE_TTL_MS = 10 * 60 * 1000;

type CategoryTryOptions = {
  storeViewCode?: string;
  cacheTtlMs?: number;
  serveStaleOnError?: boolean;
};

async function magentoGraphqlTry<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: CategoryTryOptions,
): Promise<T | null> {
  try {
    return await magentoGraphqlFetch<T>(query, variables, options);
  } catch {
    return null;
  }
}

export async function getCategoryList(
  rootId: string = "2",
  options: { storeViewCode?: string } = {},
): Promise<readonly CategoryListItem[]> {
  const trimmed = options.storeViewCode?.trim();
  const data = await magentoGraphqlTry<CategoryListResponse>(
    CATEGORY_LIST_QUERY,
    { rootId },
    {
      ...(trimmed ? { storeViewCode: trimmed } : {}),
      cacheTtlMs: CATEGORY_TREE_CACHE_TTL_MS,
      serveStaleOnError: true,
    },
  );
  return data?.categoryList ?? [];
}

/**
 * Category tree for the header nav for the active store view. Uses
 * `getCategoryNavRootIdOverride` when set; otherwise
 * `storeConfig.root_category_uid` + `categoryList` by UID; falls back
 * to root id `"2"`. Never throws.
 */
export async function getCategoryTreeForNav(
  storeViewCode: string,
): Promise<readonly CategoryListItem[]> {
  const override = getCategoryNavRootIdOverride(storeViewCode);
  if (override) {
    return getCategoryList(override, { storeViewCode });
  }

  const cfg = await getStoreConfig();
  const rootUid = cfg.root_category_uid?.trim();
  if (rootUid) {
    const byUid = await magentoGraphqlTry<CategoryListResponse>(
      CATEGORY_LIST_BY_ROOT_UID_QUERY,
      { rootUid },
      {
        storeViewCode,
        cacheTtlMs: CATEGORY_TREE_CACHE_TTL_MS,
        serveStaleOnError: true,
      },
    );
    if (byUid?.categoryList?.length) {
      return byUid.categoryList;
    }
  }

  return getCategoryList("2", { storeViewCode });
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
  const data = await magentoGraphqlTry<CategoryChildrenResponse>(
    CATEGORY_CHILDREN_QUERY,
    { parentId },
    {
      cacheTtlMs: CATEGORY_TREE_CACHE_TTL_MS,
      serveStaleOnError: true,
    },
  );

  const parent = data?.categoryList?.[0];
  return {
    parentUid: parent?.uid ?? "",
    children: parent?.children ?? [],
  };
}

export type CategoryByUrlPathResult = {
  readonly id: number;
  /** Base64 category UID — use for `products(filter: { category_uid })` when present. */
  readonly uid: string | null;
  readonly name: string;
  readonly urlPath: string;
};

/**
 * Category-by-url-path is hot during PLP resolution on multi-store /
 * multi-language. Never throws — on a PHP fatal / 5xx the result is
 * `null` (treated like "not found").
 */
export async function getCategoryByUrlPath(
  urlPath: string,
  options: { storeViewCode?: string } = {},
): Promise<CategoryByUrlPathResult | null> {
  const trimmed = options.storeViewCode?.trim();
  const data = await magentoGraphqlTry<CategoryListResponse>(
    CATEGORY_BY_URL_PATH_QUERY,
    { urlPath },
    {
      ...(trimmed ? { storeViewCode: trimmed } : {}),
      cacheTtlMs: CATEGORY_TREE_CACHE_TTL_MS,
      serveStaleOnError: true,
    },
  );

  const cat = data?.categoryList?.[0];
  if (!cat) return null;

  const row = cat as unknown as { url_path?: string | null; uid?: string | null };
  const uid = row.uid?.trim() || null;

  return {
    id: cat.id,
    uid,
    name: cat.name,
    urlPath: row.url_path ?? "",
  };
}

async function hydrateCategoryUidIfMissing(
  cat: CategoryByUrlPathResult,
  options: { storeViewCode?: string } = {},
): Promise<CategoryByUrlPathResult> {
  if (cat.uid?.trim()) return cat;

  type Row = { id?: number; uid?: string | null };
  const trimmed = options.storeViewCode?.trim();
  const data = await magentoGraphqlTry<{ categoryList?: readonly Row[] | null }>(
    CATEGORY_UID_BY_ENTITY_ID_QUERY,
    { id: String(cat.id) },
    {
      ...(trimmed ? { storeViewCode: trimmed } : {}),
      cacheTtlMs: CATEGORY_TREE_CACHE_TTL_MS,
      serveStaleOnError: true,
    },
  );
  const uid = data?.categoryList?.[0]?.uid?.trim() || null;
  if (!uid) return cat;
  return { ...cat, uid };
}

/**
 * URL segments under `/products/[...slug]` vs Magento `url_path` often
 * differ by a leading `products/` segment. Try a few shapes so PLP
 * resolves the same category as Luma.
 */
export function categoryUrlPathCandidates(slug: readonly string[]): string[] {
  const parts = slug.map((s) => s.trim()).filter(Boolean);
  const primary = parts.join("/");
  const out: string[] = [];
  if (primary) out.push(primary);
  if (parts[0] === "products" && parts.length > 1) {
    const stripped = parts.slice(1).join("/");
    if (stripped) out.push(stripped);
  } else if (parts.length > 0) {
    out.push(["products", ...parts].join("/"));
  }
  return [...new Set(out)];
}

export async function resolveCategoryFromSlug(
  slug: readonly string[],
  options: { storeViewCode?: string } = {},
): Promise<CategoryByUrlPathResult | null> {
  for (const path of categoryUrlPathCandidates(slug)) {
    const cat = await getCategoryByUrlPath(path, options);
    if (cat) return hydrateCategoryUidIfMissing(cat, options);
  }
  return null;
}
