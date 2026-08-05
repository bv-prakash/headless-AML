export type RequisitionListRow = {
  readonly uid: string;
  readonly name: string;
  readonly description: string | null;
  readonly items_count: number;
  readonly updated_at: string | null;
};

export type RequisitionListPickerItem = {
  readonly uid: string;
  readonly name: string;
};

export type RequisitionListItemProduct = {
  readonly __typename?: string | null;
  readonly uid: string;
  readonly sku: string;
  readonly name: string;
  readonly url_key?: string | null;
  readonly stock_status?: "IN_STOCK" | "OUT_OF_STOCK" | string | null;
  readonly small_image?: {
    readonly url?: string | null;
    readonly label?: string | null;
  } | null;
  readonly price_range?: {
    readonly minimum_price: {
      readonly final_price: { readonly value: number | null; readonly currency: string | null };
      readonly regular_price: { readonly value: number | null; readonly currency: string | null };
    };
  } | null;
};

export type RequisitionListItem = {
  readonly uid: string;
  readonly quantity: number;
  readonly product: RequisitionListItemProduct | null;
};

export type RequisitionListDetail = RequisitionListRow & {
  readonly items: {
    readonly items: ReadonlyArray<RequisitionListItem> | null;
  } | null;
};
