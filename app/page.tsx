import dynamic from "next/dynamic";
import { getHomePage } from "@/src/framework/graphql/queries";
import ApplyBackgroundImages from "@/src/components/pagebuilder/ApplyBackgroundImages";
import { decodePageBuilderHtmlBlocks } from "@/src/utils/pagebuilder/decodePageBuilderHtmlBlocks";

const PageBuilderSliders = dynamic(
  () => import("@/src/components/pagebuilder/PageBuilderSliders"),
);
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