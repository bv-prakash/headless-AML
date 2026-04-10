"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./AccountNavItems";

export function AccountPageTitle() {
  const pathname = usePathname();
  
  // Find exact or closest matching nav item
  const activeItem = NAV_ITEMS.find((item) => pathname === item.href);
  const pageTitle = activeItem?.label || "Account";

  return (
    <h1 className="text-2xl font-bold text-black">{pageTitle}</h1>
  );
}
