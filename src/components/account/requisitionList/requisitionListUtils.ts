/** "Apr 24, 2026" — matches the Magento Luma "Latest Activity" column. */
export function formatRequisitionListActivity(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Magento ships price values in customer-store currency — minimal formatter. */
export function formatRequisitionListPrice(
  value: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency ?? ""}`.trim();
  }
}
