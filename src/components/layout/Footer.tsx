import { getCmsBlocksByIdentifiers } from "@/src/framework/graphql/cms/queries/getCmsBlocks";
import { getStoreConfig } from "@/src/framework/graphql/store/queries/getStoreConfig";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";
import { decodeHtmlEntities } from "@/src/utils/decodeHtmlEntities";
import { sanitizeMagentoCmsHtml } from "@/src/utils/pagebuilder/sanitizeMagentoCmsHtml";

import NewsLatter from "./NewsLatter";
import ClientOnly from "../common/ClientOnly";
import { isStoreComponentEnabled } from "@/src/theme/store-view/resolveStoreViewTheme";
import StoreLanguageToggleGroup from "../store-view/StoreLanguageToggleGroup";
import CompareIcon from "../compare/CompareIcon";
import Link from "next/link";
import { ShowOnMobile } from "../common/Responsive";
import WishlistIcon from "../wishlist/WishlistIcon";

const globalWhiteImage ="../globe-white.svg";

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

  function HeaderIconsPlaceholder() {
  return (
    <div className="flex items-center gap-5">
      <span className="w-[22px] h-[22px]" />
      <span className="w-[22px] h-[22px]" />
      <span className="w-[22px] h-[22px]" />
      <span className="w-[26px] h-[26px]" />
    </div>
  );
}

  return (
    <footer className={`text-white border-t-2 md:border-t-4 max-md:mb-12.5 ${storeViewCode === "prizmlighting_store_view" ? "bg-theme-body-bg border-theme-body-bg" : "bg-theme-secondary border-theme-primary"}`}>
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
        <small className="copyright-text max-md:border-t max-md:mt-[25px] max-md:pt-5.5 max-md:text-center block text-xs mt-5 lg:mt-10">
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
      <ShowOnMobile breakpoint={767}>
        <div className="bg-theme-secondary text-center text-white text-xs py-[15px] grid grid-cols-4 justify-items-center m-0 border-t border-[rgba(255,255,255,0.25)] fixed left-0 right-0 bottom-0 z-[99] w-full">
          <ClientOnly fallback={<HeaderIconsPlaceholder />}>
            <StoreLanguageToggleGroup className="flex item-center justify-center w-full text-center border-r border-white" imageSrc={globalWhiteImage} />
            {isStoreComponentEnabled("compareIcon", storeViewCode) ? <CompareIcon className="flex item-center justify-center w-full border-r border-white text-center" /> : null}
            {isStoreComponentEnabled("wishlistIcon", storeViewCode) ? <WishlistIcon /> : null}
          </ClientOnly>
          <Link
              href="/contact-us"
              className={`relative flex items-center gap-1 hover:text-theme-primary transition-colors`}
            >
              <i className="icon-call2 text-[22px] leading-1" aria-hidden="true" />
            </Link>
        </div>
      </ShowOnMobile>
    </footer>
  );
};

export default Footer;
