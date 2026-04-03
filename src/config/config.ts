type CommerceConfig = {
  readonly baseUrl: string | undefined;
  readonly storeCode: string | undefined;
  readonly apiKey: string | undefined;
};

type AppConfig = {
  readonly commerce: CommerceConfig;
  readonly imageDomain: string | undefined;
  readonly graphqlEndpoint: string;
};

const config: AppConfig = Object.freeze({
  commerce: Object.freeze({
    baseUrl: process.env.NEXT_PUBLIC_COMMERCE_BASE_URL,
    storeCode: process.env.NEXT_PUBLIC_COMMERCE_STORE_CODE,
    apiKey: process.env.COMMERCE_API_KEY,
  }),
  imageDomain: process.env.NEXT_PUBLIC_IMAGE_DOMAIN,
  graphqlEndpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "/graphql",
});

export default config;
