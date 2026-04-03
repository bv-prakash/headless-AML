import { getFirstCmsBlockByIdentifier } from "./cmsBlocks";
import type { CmsBlockItem } from "./cmsBlocks";

const FOOTER_BLOCK_IDS = {
  left: "footer-left",
  service: "footer-service",
  social: "footer-social",
} as const;

async function getFooterBlock(
  identifier: string,
): Promise<CmsBlockItem | null> {
  try {
    return await getFirstCmsBlockByIdentifier(identifier);
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Footer "${identifier}" CMS GraphQL request failed:`, error);
    }
    return null;
  }
}

export const getFooterLeftCmsBlock = () =>
  getFooterBlock(FOOTER_BLOCK_IDS.left);

export const getFooterServiceCmsBlock = () =>
  getFooterBlock(FOOTER_BLOCK_IDS.service);

export const getFooterSocialCmsBlock = () =>
  getFooterBlock(FOOTER_BLOCK_IDS.social);
