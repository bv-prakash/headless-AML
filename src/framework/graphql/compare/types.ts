export type CompareMutationResult = {
  readonly uid: string;
  readonly item_count: number;
  readonly items: readonly {
    readonly uid: string;
    readonly product: { readonly sku: string; readonly name: string };
  }[];
};

export type CompareAttribute = {
  readonly code: string;
  readonly label: string;
};

export type CompareProductItem = {
  readonly uid: string;
  readonly product: {
    readonly sku: string;
    readonly name: string;
    readonly url_key?: string;
    readonly description?: { readonly html?: string } | null;
    readonly small_image?: { readonly url?: string | null } | null;
    readonly price_range?: {
      readonly minimum_price?: {
        readonly regular_price?: {
          readonly value?: number | null;
          readonly currency?: string | null;
        } | null;
      } | null;
    } | null;
  };
};

export type CompareListData = {
  readonly uid: string;
  readonly item_count: number;
  readonly attributes: readonly CompareAttribute[];
  readonly items: readonly CompareProductItem[];
};
