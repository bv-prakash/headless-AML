export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  SimpleProduct: "Simple Product",
  ConfigurableProduct: "Configurable Product",
  BundleProduct: "Bundle Product",
  GroupedProduct: "Grouped Product",
  VirtualProduct: "Virtual Product",
  DownloadableProduct: "Downloadable Product",
  GiftCardProduct: "Gift Card",
};

export function formatProductTypeLabel(typeName: string): string {
  return PRODUCT_TYPE_LABELS[typeName] ?? typeName.replace(/([A-Z])/g, " $1").trim();
}
