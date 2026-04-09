import { getHomePage } from "@/src/framework/graphql/queries";
import HomePageShell from "@/src/components/pagebuilder/HomePageShell";
import { decodePageBuilderHtmlBlocks } from "@/src/utils/pagebuilder/decodePageBuilderHtmlBlocks";

const Home = async () => {
  const homePage = await getHomePage();

  const rawContent = decodePageBuilderHtmlBlocks(homePage?.content ?? "");
  return <HomePageShell rawContent={rawContent} />;
}

export default Home;