import {
  getFooterLeftCmsBlock,
  getFooterServiceCmsBlock,
  getFooterSocialCmsBlock,
} from "@/src/framework/graphql";
import { getStoreConfig } from "@/src/framework/graphql/queries/storeConfig";
import { decodeHtmlEntities } from "@/src/utils/decodeHtmlEntities";
import NewsLatter from "./NewsLatter";

const decodeMaybeEscapedHtml = (raw: string): string => {
  return raw.includes("&lt;") || raw.includes("&gt;") ? decodeHtmlEntities(raw) : raw;
};

const Footer = async () => {
  const [footerLeftBlock, footerServiceBlock, footerSocialBlock, storeConfig] =
    await Promise.all([
      getFooterLeftCmsBlock(),
      getFooterServiceCmsBlock(),
      getFooterSocialCmsBlock(),
      getStoreConfig(),
    ]);

  const copyrightHtml = storeConfig.copyright?.trim();

  return (
    <footer className="bg-theme-secondary text-white border-t-2 border-theme-primary md:border-t-4">
      <div className="container pt-10 pb-[25px] lg-custom:flex lg-custom:flex-wrap">
        {footerLeftBlock ? (
          <div
            className="footer-left-block lg-custom:w-[62%] lg-custom:pr-5 lg:flex"
            dangerouslySetInnerHTML={{
              __html: decodeMaybeEscapedHtml(footerLeftBlock.content ?? ""),
            }}
          />
        ) : null}

        <div className="footer-right-block md:flex lg-custom:block! lg-custom:w-[38%]">
          <NewsLatter />
          <div className="footer-bottom md:w-[61%] pl-7.5 lg:flex-wrap lg:flex lg-custom:w-full! lg-custom:pl-0">
            {footerServiceBlock ? (
              <div
                className="footer-service-block sm:-mx-[5px] lg:w-[calc(100%-130px)] lg-custom:w-full lg-custom:mb-5 xl-custom:w-[calc(100%-130px)]"
                dangerouslySetInnerHTML={{
                  __html: decodeMaybeEscapedHtml(footerServiceBlock.content ?? ""),
                }}
              />
            ) : null}

            {footerSocialBlock ? (
              <div
                className="footer-social-block"
                dangerouslySetInnerHTML={{
                  __html: decodeMaybeEscapedHtml(footerSocialBlock.content ?? ""),
                }}
              />
            ) : null}
          </div>
        </div>
        <small className="copyright-text block text-xs mt-5 lg:mt-10">
          {copyrightHtml ? (
            <span
              dangerouslySetInnerHTML={{
                __html: decodeMaybeEscapedHtml(copyrightHtml),
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
