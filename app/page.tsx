import { getHomePage } from "@/src/framework/graphql/queries";
import ApplyBackgroundImages from "@/src/components/pagebuilder/ApplyBackgroundImages";
import PageBuilderSliders from "@/src/components/pagebuilder/PageBuilderSliders";
import { decodePageBuilderHtmlBlocks } from "@/src/utils/pagebuilder/decodePageBuilderHtmlBlocks";
const Home = async () => {
  const homePage = await getHomePage();

  const rawContent = decodePageBuilderHtmlBlocks(homePage?.content ?? "");
  return (
    <div>
      {/* PageBuilder inline styles target #html-body, so we provide that wrapper */}
      <div
        id="html-body"
        dangerouslySetInnerHTML={{ __html: rawContent }}
      />
      <ApplyBackgroundImages />
      <PageBuilderSliders autoplay pagination loop autoplayDelayMs={7000} />
    </div>
  );
}

export default Home;