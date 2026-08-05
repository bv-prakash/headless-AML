import type { ProductStockStatus } from "@/src/framework/graphql/plp/queries/getProductsByCategory";

export type PLPContentProduct = {
  readonly productId: number;
  readonly sku: string;
  readonly href: string;
  readonly imageUrl: string;
  readonly name: string;
  readonly description?: string;
  readonly productType?: string;
  readonly stockStatus: ProductStockStatus;
};
