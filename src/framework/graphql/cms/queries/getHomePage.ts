import { magentoGraphqlFetchSafe } from "@/src/framework/graphql/magentoGraphqlFetch";
import { getDefaultStoreViewCodeFromEnv } from "@/src/config/storeViews";
import { isCmsNotFoundGraphqlError } from "./getCmsBlocks";

type HomePageData = {
  readonly title: string;
  readonly content_heading: string;
  readonly content: string;
  readonly url_key: string;
  readonly meta_title: string;
  readonly meta_description: string;
};

type CmsPageQueryResponse = {
  cmsPage?: HomePageData | null;
};

/**
 * Plain query string (not `gql`) — Magento's HTTP GraphQL endpoint
 * expects a string body and `magentoGraphqlFetch` sends the `Store`
 * header so the result is scoped to the active store view.
 */
const HOME_QUERY = `
  query HomePage($identifier: String!) {
    cmsPage(identifier: $identifier) {
      title
      content_heading
      content
      url_key
      meta_title
      meta_description
    }
  }
`;

type GetHomePageOptions = { identifier?: string; storeViewCode?: string };

/**
 * Fetches a CMS page for the active store view. Uses
 * `magentoGraphqlFetchSafe` (never throws). Magento PHP fatals /
 * timeouts / 5xx return `null` quietly so Next 16's RSC console-error
 * replay does not surface a "Console MagentoGraphqlError" in the
 * browser dev overlay.
 */
export async function getHomePage(
  options: GetHomePageOptions = {},
): Promise<HomePageData | null> {
  const { identifier = "home", storeViewCode } = options;
  const requestedStoreViewCode = storeViewCode?.trim();
  const defaultStoreViewCode = getDefaultStoreViewCodeFromEnv();

  const fetchByStoreView = async (
    code?: string,
  ): Promise<HomePageData | null> => {
    const result = await magentoGraphqlFetchSafe<CmsPageQueryResponse>(
      HOME_QUERY,
      { identifier },
      {
        ...(code ? { storeViewCode: code } : {}),
        cacheTtlMs: 5 * 60 * 1000,
        serveStaleOnError: true,
      },
    );

    if (result.ok) return result.data.cmsPage ?? null;

    const { error, kind } = result;
    const notFound = isCmsNotFoundGraphqlError(error as unknown);

    /**
     * "No such CMS page" is expected when a store view doesn't define
     * the identifier. PHP fatals / timeouts / network errors are
     * already typed and need no dev overlay. Real GraphQL surprises
     * still get a quiet server-only log.
     */
    if (!notFound && kind !== "phpFatal" && process.env.NODE_ENV !== "production") {
      console.warn(
        `[getHomePage] Magento CMS page "${identifier}" (store: ${code ?? "active"}) failed: ${error.message}`,
      );
    }
    return null;
  };

  const primaryPage = await fetchByStoreView(requestedStoreViewCode);
  if (primaryPage) return primaryPage;

  const shouldFallbackToDefault =
    requestedStoreViewCode &&
    defaultStoreViewCode &&
    requestedStoreViewCode !== defaultStoreViewCode;

  if (shouldFallbackToDefault) {
    return fetchByStoreView(defaultStoreViewCode);
  }

  return null;
}
