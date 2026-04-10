
import { getCategoryBreadcrumbs } from "@/src/framework/graphql/queries/breadcrumbs";
import { Breadcrumbs } from "@/src/components/common/Breadcrumbs";
import type { BreadcrumbItem } from "@/src/components/common/Breadcrumbs";

interface ServerBreadcrumbsProps {
  categoryId: string;
  productName?: string;
}

export default async function ServerBreadcrumbs({ 
  categoryId, 
  productName 
}: ServerBreadcrumbsProps) {
  const { name, breadcrumbs, urlPath } = await getCategoryBreadcrumbs(categoryId);
  
  // 1. Map parent categories as clickable links
  const trail: BreadcrumbItem[] = breadcrumbs.map((crumb) => ({
    label: crumb.category_name,
    href: `/products/${crumb.category_url_path ?? ""}`,
  }));

  // 2. Add the current category
  if (name) {
    trail.push({
      label: name,
      href: productName ? `/products/${urlPath}` : undefined,
    });
  }

  // 3. Add the product name as plain text if it exists
  if (productName) {
    trail.push({ label: productName });
  }

  return <Breadcrumbs items={trail} />;
}