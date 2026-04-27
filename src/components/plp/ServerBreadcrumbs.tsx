import { getCategoryBreadcrumbs } from "@/src/framework/graphql/queries/breadcrumbs";
import type { CategoryBreadcrumbsData } from "@/src/framework/graphql/queries/breadcrumbs";
import { Breadcrumbs } from "@/src/components/common/Breadcrumbs";
import type { BreadcrumbItem } from "@/src/components/common/Breadcrumbs";
import { plpHrefFromMagentoCategoryUrlPath } from "@/src/utils/plpPaths";

interface ServerBreadcrumbsProps {
  categoryId: string;
  productName?: string;
  /** When set (e.g. PLP), skips a second `getCategoryBreadcrumbs` round-trip. */
  prefetched?: CategoryBreadcrumbsData;
}

export default async function ServerBreadcrumbs({
  categoryId,
  productName,
  prefetched,
}: ServerBreadcrumbsProps) {
  const { name, breadcrumbs, urlPath } =
    prefetched ?? (await getCategoryBreadcrumbs(categoryId));
  
  // 1. Map parent categories as clickable links
  const trail: BreadcrumbItem[] = breadcrumbs.map((crumb) => ({
    label: crumb.category_name,
    href: plpHrefFromMagentoCategoryUrlPath(crumb.category_url_path),
  }));

  // 2. Add the current category
  if (name) {
    trail.push({
      label: name,
      href: productName
        ? plpHrefFromMagentoCategoryUrlPath(urlPath)
        : undefined,
    });
  }

  // 3. Add the product name as plain text if it exists
  if (productName) {
    trail.push({ label: productName });
  }

  return <Breadcrumbs items={trail} />;
}