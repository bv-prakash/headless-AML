import { getCmsBlocksByIdentifiers } from "@/src/framework/graphql/cms/queries/getCmsBlocks";
import { getStoreConfig } from "@/src/framework/graphql/store/queries/getStoreConfig";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";
import { decodeHtmlEntities } from "@/src/utils/decodeHtmlEntities";
import { sanitizeMagentoCmsHtml } from "@/src/utils/pagebuilder/sanitizeMagentoCmsHtml";

import NewsLatter from "./NewsLatter";

const FOOTER_CMS_IDENTIFIERS = [
  "footer-left",
  "footer-service",
  "footer-social",
] as const;

/**
 * CMS blocks occasionally contain HTML-entity-encoded markup and Magento
 * storefront inline scripts (RequireJS / `text/x-magento-init`). Decode the
 * entities first, then strip storefront-only `<script>` payloads that would
 * otherwise throw `require is not defined` in this headless frontend.
 */
const prepareCmsBlockHtml = (raw: string | null | undefined): string => {
  if (!raw) return "";
  const decoded =
    raw.includes("&lt;") || raw.includes("&gt;") ? decodeHtmlEntities(raw) : raw;
  return sanitizeMagentoCmsHtml(decoded);
};

const Footer = async () => {
  const storeViewCode = await getServerStoreViewCode();
  const [cmsItems, storeConfig] = await Promise.all([
    getCmsBlocksByIdentifiers([...FOOTER_CMS_IDENTIFIERS], { storeViewCode }),
    getStoreConfig(),
  ]);

  const byIdentifier = new Map(cmsItems.map((b) => [b.identifier, b]));
  const footerLeftBlock = byIdentifier.get("footer-left") ?? null;
  const footerServiceBlock = byIdentifier.get("footer-service") ?? null;
  const footerSocialBlock = byIdentifier.get("footer-social") ?? null;

  const copyrightHtml = storeConfig.copyright?.trim();

  return (
    <footer className={`text-white border-t-2 md:border-t-4 ${storeViewCode === "prizmlighting_store_view" ? "bg-theme-body-bg border-theme-body-bg" : "bg-theme-secondary border-theme-primary"}`}>
      <div className="container pt-10 pb-[25px] lg-custom:flex lg-custom:flex-wrap">
        {footerLeftBlock ? (
          <div
            className="footer-left-block lg-custom:w-[62%] lg-custom:pr-5 lg:flex"
            dangerouslySetInnerHTML={{
              __html: prepareCmsBlockHtml(footerLeftBlock.content),
            }}
          />
        ) : null}

        <div className="footer-right-block md:flex lg-custom:block! lg-custom:w-[38%]">
          <NewsLatter />
          <div className="footer-bottom md:w-[61%] lg:flex-wrap lg:flex lg-custom:w-full! lg-custom:pl-0">
            {footerServiceBlock ? (
              <div
                className="footer-service-block sm:-mx-[5px] lg:w-[calc(100%-130px)] lg-custom:w-full lg-custom:mb-5 xl-custom:w-[calc(100%-130px)]"
                dangerouslySetInnerHTML={{
                  __html: prepareCmsBlockHtml(footerServiceBlock.content),
                }}
              />
            ) : null}

            {footerSocialBlock ? (
              <div
                className="footer-social-block"
                dangerouslySetInnerHTML={{
                  __html: prepareCmsBlockHtml(footerSocialBlock.content),
                }}
              />
            ) : null}
          </div>
        </div>
        <small className="copyright-text block text-xs mt-5 lg:mt-10">
          {copyrightHtml ? (
            <span
              dangerouslySetInnerHTML={{
                __html: prepareCmsBlockHtml(copyrightHtml),
              }}
            />
          ) : (
            "© 2026 American Lighting Inc. All Rights Reserved"
          )}
        </small>
      </div>
    </footer>
  );
};

export default Footer;
