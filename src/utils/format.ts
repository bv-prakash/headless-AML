export function formatPrice(
  value?: number | null,
  currency?: string | null,
): string {
  if (value == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  }).format(value);
}
