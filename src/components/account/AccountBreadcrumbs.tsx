"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/src/components/common/navigation/Breadcrumbs";
import { NAV_ITEMS } from "./AccountNavItems";

export function AccountBreadcrumbs() {
  const pathname = usePathname();
  const matchedItems = NAV_ITEMS.filter((item) => pathname.startsWith(item.href));
  
  // Map items, removing href from the last item (current page)
  const items = matchedItems.map((item, index) => ({
    label: item.label,
    ...(index < matchedItems.length - 1 && { href: item.href }),
  }));

  return <Breadcrumbs items={items} />;
}
