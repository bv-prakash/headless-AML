"use client";

import { CategoryNavigationMenuProps } from "./CategoryNavTypes";
import CategoryNavDesktop from "./CategoryNavDesktop";
import CategoryNavMobile from "./CategoryNavMobile";
import { ShowOnDesktop, ShowOnMobile } from "@/src/components/common/Responsive";
import { useEffect, useState } from "react";


export default function CategoryNavigationMenu({ items }: CategoryNavigationMenuProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
      const handleToggleNav = () => {
        setMobileMenuOpen((prev) => !prev);
      };
  
      window.addEventListener("toggle-category-nav", handleToggleNav);
      return () => window.removeEventListener("toggle-category-nav", handleToggleNav);
    }, []);

  return (
    <nav
      aria-label="Product categories"
      className={`category-nav-wrapper bg-theme-header-bg max-lg-custom:fixed max-lg-custom:inset-0 max-lg-custom:top-0 max-lg-custom:w-full max-lg-custom:overflow-auto max-lg-custom:[-webkit-overflow-scrolling:touch] max-lg-custom:transition-all max-lg-custom:duration-300 max-lg-custom:ease-in-out max-lg-custom:z-[99]
    ${
      mobileMenuOpen
        ? "max-lg-custom:h-full max-lg-custom:shadow-[0_0_5px_0_rgba(50,50,50,0.75)] max-md:h-[calc(100%-57px)]"
        : "max-lg-custom:h-0"
    }`}
    >
      <ShowOnMobile>
        <CategoryNavMobile items={items} />
      </ShowOnMobile>
      <ShowOnDesktop>
        <CategoryNavDesktop items={items} />
      </ShowOnDesktop>
     </nav>
  );
}
