import {
  magentoGraphqlFetch,
  MagentoGraphqlError,
} from "@/src/framework/graphql/magentoGraphqlFetch";
import { getDefaultStoreViewCodeFromEnv } from "@/src/config/storeViews";

export type CmsBlocksFetchOptions = { storeViewCode?: string };

export type CmsBlockItem = {
  identifier: string;
  title: string;
  content: string;
};

type CmsBlocksQueryResponse = {
  cmsBlocks?: {
    items?: CmsBlockItem[] | null;
  } | null;
};

const CMS_BLOCKS_QUERY = `
  query CmsBlocks($identifiers: [String!]!) {
    cmsBlocks(identifiers: $identifiers) {
      items {
        identifier
        title
        content
      }
    }
  }
`;

/**
 * Magento raises `The CMS block with the "<id>" ID doesn't exist.` when any requested
 * identifier is missing on the active store view. In a multi-store setup individual
 * blocks are expected to be absent on some views, so this is not an exceptional state —
 * treat it as "not configured here".
 */
export function isCmsNotFoundGraphqlError(err: unknown): err is MagentoGraphqlError {
  if (!(err instanceof MagentoGraphqlError)) return false;
  const messages = [
    err.message,
    ...(err.graphqlErrors?.map((e) => e.message ?? "") ?? []),
  ]
    .filter(Boolean)
    .map((m) => m.toLowerCase());
  if (!messages.length) return false;
  return messages.every(
    (m) =>
      m.includes("doesn't exist") ||
      m.includes("does not exist") ||
      m.includes("no such entity"),
  );
}

/**
 * Fetches CMS blocks for the active store view, identifier by identifier.
 *
 * Per-identifier fetching is required for correct multi-store / multi-language rendering:
 * Magento's `cmsBlocks(identifiers: [...])` resolver throws a single
 * `The CMS block with the "<id>" ID doesn't exist.` error for the whole query when **any**
 * requested identifier is missing on the active store view — discarding the blocks that
 * *do* exist. A batched request on e.g. the Arabic store view therefore collapses to "no
 * items" as soon as one block is not yet localised, which previously caused the whole
 * footer to silently fall back to the English default store.
 *
 * Fetching each identifier in its own request isolates these failures:
 *  - Blocks present on the active store view are returned with their localised content.
 *  - Only the missing identifiers fall back to the default store view.
 *  - The 5 min in-process response cache + in-flight dedupe keep Magento load flat even
 *    with N parallel requests (common identifiers like `footer-left` are cached per
 *    Store header, so repeat renders cost one POST per store view).
 */
export async function getCmsBlocksByIdentifiers(
  identifiers: readonly string[],
  options: CmsBlocksFetchOptions = {},
): Promise<CmsBlockItem[]> {
  if (identifiers.length === 0) return [];

  const { storeViewCode } = options;
  const requestedStoreViewCode = storeViewCode?.trim();
  const defaultStoreViewCode = getDefaultStoreViewCodeFromEnv();

  const debug = process.env.DEBUG_CMS_BLOCKS === "1";

  const fetchOneByStoreView = async (
    identifier: string,
    code?: string,
  ): Promise<CmsBlockItem | null> => {
    try {
      const data = await magentoGraphqlFetch<CmsBlocksQueryResponse>(
        CMS_BLOCKS_QUERY,
        { identifiers: [identifier] },
        {
          ...(code ? { storeViewCode: code } : {}),
          /** CMS blocks are edited rarely; 5 min keeps footer / static content off Magento. */
          cacheTtlMs: 5 * 60 * 1000,
          serveStaleOnError: true,
        },
      );

      const items = data.cmsBlocks?.items ?? [];
      const match =
        items.find((b) => b.identifier === identifier) ?? items[0] ?? null;

      if (debug) {
        console.info(
          `[cmsBlocks] Store="${code ?? "(cookie)"}" identifier="${identifier}" ` +
            `resolved=${match ? `yes (title="${match.title}", bytes=${match.content?.length ?? 0})` : "no"}`,
        );
      }
      return match;
    } catch (err: unknown) {
      if (debug) {
        const msg = err instanceof Error ? err.message : String(err);
        console.info(
          `[cmsBlocks] Store="${code ?? "(cookie)"}" identifier="${identifier}" error="${msg}"`,
        );
      }
      if (isCmsNotFoundGraphqlError(err)) return null;
      if (err instanceof MagentoGraphqlError && err.isPhpFatal) return null;
      throw err;
    }
  };

  const shouldFallbackToDefault = Boolean(
    requestedStoreViewCode &&
      defaultStoreViewCode &&
      requestedStoreViewCode !== defaultStoreViewCode,
  );

  const resolved = await Promise.all(
    identifiers.map(async (identifier) => {
      const primary = await fetchOneByStoreView(
        identifier,
        requestedStoreViewCode,
      );
      if (primary) return primary;
      if (!shouldFallbackToDefault) return null;
      return fetchOneByStoreView(identifier, defaultStoreViewCode);
    }),
  );

  return resolved.filter((b): b is CmsBlockItem => b !== null);
}

export async function getFirstCmsBlockByIdentifier(
  identifier: string,
  options: CmsBlocksFetchOptions = {},
): Promise<CmsBlockItem | null> {
  const items = await getCmsBlocksByIdentifiers([identifier], options);
  return items.find((b) => b.identifier === identifier) ?? items[0] ?? null;
}
