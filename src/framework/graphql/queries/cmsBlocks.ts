import { magentoGraphqlFetch } from "@/src/framework/graphql/magentoGraphqlFetch";

type RevalidateOptions = { revalidate?: number };

const DEFAULT_REVALIDATE_SECONDS = 300;

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

export async function getCmsBlocksByIdentifiers(
  identifiers: readonly string[],
  options: RevalidateOptions = {},
): Promise<CmsBlockItem[]> {
  if (identifiers.length === 0) return [];

  const { revalidate = DEFAULT_REVALIDATE_SECONDS } = options;

  const data = await magentoGraphqlFetch<CmsBlocksQueryResponse>(
    CMS_BLOCKS_QUERY,
    { identifiers: [...identifiers] },
    { revalidate },
  );

  return data.cmsBlocks?.items ?? [];
}

export async function getFirstCmsBlockByIdentifier(
  identifier: string,
  options: RevalidateOptions = {},
): Promise<CmsBlockItem | null> {
  const items = await getCmsBlocksByIdentifiers([identifier], options);
  return items[0] ?? null;
}
