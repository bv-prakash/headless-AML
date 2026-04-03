import client from "@/src/framework/graphql/apolloClient";
import { gql } from "@apollo/client";

type HomePageData = {
  readonly title: string;
  readonly content_heading: string;
  readonly content: string;
  readonly url_key: string;
  readonly meta_title: string;
  readonly meta_description: string;
};

type CmsPageQueryResponse = {
  cmsPage?: HomePageData | null;
};

const HOME_QUERY = gql`
  query HomePage {
    cmsPage(identifier: "home") {
      title
      content_heading
      content
      url_key
      meta_title
      meta_description
    }
  }
`;

export async function getHomePage(): Promise<HomePageData | null> {
  try {
    const result = await client.query<CmsPageQueryResponse>({
      query: HOME_QUERY,
      fetchPolicy: "cache-first",
    });

    return result.data?.cmsPage ?? null;
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Home page CMS GraphQL request failed:", error);
    }
    return null;
  }
}
