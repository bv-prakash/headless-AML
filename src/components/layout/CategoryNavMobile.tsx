"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { plpHrefFromMagentoCategoryUrlPath } from "@/src/utils/plpPaths";
import { CategoryNavigationMenuProps, NavigationItem } from "./CategoryNavTypes";

export default function CategoryNavMobile({ items }: CategoryNavigationMenuProps) {
  const [openIds, setOpenIds] = useState<number[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileBodyStyle = "overflow-hidden relative h-full w-full"

  useEffect(() => {
    const handleToggleNav = () => {
      setMobileMenuOpen((prev) => !prev);
      setOpenIds([]);
    };

    window.addEventListener("toggle-category-nav", handleToggleNav);
    return () => window.removeEventListener("toggle-category-nav", handleToggleNav);
  }, []);

  const toggleMobileCategory = useCallback((catId: number) => {
    setOpenIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  }, []);

  const closeMenu = useCallback(() => {
    setOpenIds([]);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add(...mobileBodyStyle.split(" "));
    } else {
      document.body.classList.remove(...mobileBodyStyle.split(" "));
    }
    return () => {
      document.body.classList.remove(...mobileBodyStyle.split(" "));
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <ul
        id="category-nav-mobile-menu"
        aria-hidden={!mobileMenuOpen}
        className={`category-nav__menu-list category-nav__menu-list--simple-menu max-h-[calc(100%-60px)] top-15 overflow-auto z-[1] relative lg-custom:hidden `}
      >
        {/* Loop through top level items */}
          {items.map((cat) => (
            <NavMobileItem
              key={cat.id}
              item={cat}
              openIds={openIds}
              onToggle={toggleMobileCategory}
              onClose={closeMenu}
              depth={0}
            />
          ))}

        <li className="px-4 py-3">
          <Link
            href="/contact-us"
            className="whitespace-nowrap text-base font-bold leading-[1.3] text-theme-header-fg transition-colors hover:text-theme-primary focus:outline-none focus-visible:text-theme-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-theme-primary"
            onClick={closeMenu}
          >
            Contact Us
          </Link>
        </li>
      </ul>
    </>
  );
}

interface NavMobileItemProps {
  item: NavigationItem;
  openIds: number[];
  onToggle: (id: number) => void;
  onClose: () => void;
  depth: number;
}
function NavMobileItem({ item, openIds, onToggle, onClose, depth }: NavMobileItemProps) {
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const isOpen = openIds.includes(item.id);

  // Replicating style properties dynamically by depth levels
  const paddingLeftClass = depth >= 0 ? "pl-4" : "";
  const borderClass = depth === 0 ? "border-b border-theme-header-border pb-2 px-4" : "mt-1";
  const textClass = depth === 0 
    ? "text-base font-bold text-theme-header-fg" 
    : "text-base font-bold text-theme-primary text-black opacity-90";

  return (
    <li className={`category-nav__item ${borderClass}`}>
      <div className="flex items-center justify-between gap-3 py-2.5">
        <Link
          href={plpHrefFromMagentoCategoryUrlPath(item.url_path)}
          className={`category-nav__link uppercase transition-colors hover:text-theme-primary focus:outline-none ${textClass}`}
          onClick={() => {
            if (!hasChildren) onClose();
          }}
        >
          {item.name}
        </Link>

        {hasChildren && (
          <button
            type="button"
            className="category-nav__toggle text-theme-primary font-bold hover:text-theme-primary focus:outline-none"
            aria-expanded={isOpen}
            aria-controls={`mobile-submenu-${item.id}`}
            onClick={() => onToggle(item.id)}
          >
            {/* Swapped literal text arrow for the dynamic arrow styling matching desktop design rules */}
            <i
              className={`icon-back-arrow text-lg block transition-transform duration-200 before:font-bold ${
                isOpen ? "rotate-90" : "-rotate-90"
              }`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
        
      {/* Recursive Deep Tree Render Logic */}
      {hasChildren && isOpen && (
        <ul
          id={`mobile-submenu-${item.id}`}
          className={`category-nav__submenu--mobile space-y-1 pb-3 ${paddingLeftClass}`}
        >
          {(item.children ?? []).map((child) => (
            <NavMobileItem
              key={child.id}
              item={child}
              openIds={openIds}
              onToggle={onToggle}
              onClose={onClose}
              depth={depth + 1} // Increment depth value automatically to draw Grand Submenus correctly
            />
          ))}
        </ul>
      )}
    </li>
  );
}