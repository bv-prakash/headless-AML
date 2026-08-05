"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useB2BNavGating } from "@/src/hooks/useB2BNavGating";
import { NAV_ITEMS } from "./AccountNavItems";

export function MyAccountSidebar() {
  const pathname = usePathname();
  const { gates, loading } = useB2BNavGating();

  const visibleItems = useMemo(() => {
    /**
     * While gates resolve, hide gated items rather than flashing them in and
     * then removing them once Magento responds.
     */
    if (loading) return NAV_ITEMS.filter((i) => !i.requires);
    return NAV_ITEMS.filter((i) => !i.requires || gates[i.requires]);
  }, [gates, loading]);

  return (
    <nav>
      <ul className="m-0 p-0 last-none">
        {visibleItems.map((i) => {
          const isActive =
            i.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(i.href);

          return (
            <li key={i.href} className="m-0 border-b border-f0f0f0 first:border-t">
              <Link
                href={i.href}
                className={`block leading-[22px] py-5 px-[15px] text-black decoration-none md:py-5 md:px-7.5 hover:text-white hover:bg-theme-primary ${
                  isActive ? "bg-theme-primary text-white" : ""
                }`}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
