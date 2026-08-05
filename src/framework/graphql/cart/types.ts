export type CartItemPrice = {
  readonly value: number;
  readonly currency: string;
};

export type ConfigurableCartOption = {
  readonly option_label: string;
  readonly value_label: string;
};

export type BundleCartOptionValue = {
  readonly id: number;
  readonly label: string;
  readonly price: number;
  readonly quantity: number;
};

export type BundleCartOption = {
  readonly uid: string;
  readonly label: string;
  readonly type: string;
  readonly values: readonly BundleCartOptionValue[];
};

export type DownloadableCartLink = {
  readonly title: string;
  readonly price: number;
};

export type DownloadableCartSample = {
  readonly title: string;
  readonly sample_url: string;
};

export type CartItem = {
  readonly uid: string;
  readonly product: {
    readonly sku: string;
    readonly name: string;
    readonly url_key: string;
    readonly small_image?: { readonly url?: string | null } | null;
  } | null;
  readonly quantity: number;
  readonly prices: {
    readonly row_total: CartItemPrice;
  } | null;
  readonly configurable_options?: readonly ConfigurableCartOption[];
  readonly bundle_options?: readonly BundleCartOption[];
  readonly links?: readonly DownloadableCartLink[];
  readonly samples?: readonly DownloadableCartSample[];
};

export type CartPrices = {
  readonly grand_total: CartItemPrice;
  readonly subtotal_excluding_tax: CartItemPrice;
};

export type CartData = {
  /** Masked cart id (returned by cart queries/mutations). */
  readonly id?: string;
  readonly total_quantity: number;
  readonly items: readonly CartItem[];
  readonly prices: CartPrices;
};
