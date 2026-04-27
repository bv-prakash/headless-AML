import { getHomePage } from "@/src/framework/graphql/queries";
import HomePageShell from "@/src/components/pagebuilder/HomePageShell";
import { decodePageBuilderHtmlBlocks } from "@/src/utils/pagebuilder/decodePageBuilderHtmlBlocks";
import { sanitizeMagentoCmsHtml } from "@/src/utils/pagebuilder/sanitizeMagentoCmsHtml";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";

/** Per-request CMS + cookie store; avoids static home always using the default store view. */
export const dynamic = "force-dynamic";

const Home = async () => {
  const storeViewKey = await getServerStoreViewCode();
  const homePage = await getHomePage({ storeViewCode: storeViewKey });

  const rawContent = sanitizeMagentoCmsHtml(
    decodePageBuilderHtmlBlocks(homePage?.content ?? ""),
  );
  return (
    <>
      {/*
        PageBuilder HTML must stay in this Server Component: putting the same string
        inside a Client Component’s `dangerouslySetInnerHTML` can trigger hydration
        mismatches (DOM normalization / timing) even when the payload matches.
      */}
      <div
        key={`home-cms-${storeViewKey}`}
        id="html-body"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: rawContent }}
      />
      <HomePageShell storeViewKey={storeViewKey} />
    </>
  );
};

export default Home;