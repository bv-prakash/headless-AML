"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./AccountNavItems";

export function AccountPageTitle() {
  const pathname = usePathname();
  
  // Find exact or closest matching nav item
  const activeItem = NAV_ITEMS.find((item) => pathname === item.href);
  const pageTitle =  activeItem?.pageTitle || activeItem?.label || "Account";

  return (
    <h1 className="text-xl leading-[1.1] mb-5 mt-0 font-semibold md:text-[26px] lg-custom:text-[32px]! lg-custom:mb-7.5! uppercase mb-5 border-b border-aaa pt-2.5 md:pt-0 pb-[15px]">{pageTitle}</h1>
  );
}
