"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useClickOutside } from "@/src/hooks/useClickOutside";
import { plpHrefFromMagentoCategoryUrlPath } from "@/src/utils/plpPaths";
import { CategoryNavigationMenuProps, NavigationItem } from "./CategoryNavTypes";

function getFocusableItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
}

function getTopLevelItemClass(hasChildren: boolean, hasChildWithinChild: boolean | undefined) {
  const base = "category-nav__item";
  if (!hasChildren) return base;
  return `${base} ${hasChildWithinChild ? "category-nav__item--mega" : "relative category-nav__item--simple"}`;
}

function getSubmenuClassName(depth: number, items: readonly NavigationItem[]) {
  const hasNestedChildren = Boolean(items.some((item) => item.children && item.children.length > 0));
  if (depth === 0) {
    return `absolute bg-white z-50 category-nav__submenu category-nav__submenu--level-0 shadow-[0_0_10px_rgba(0,0,0,0.25)] ${hasNestedChildren ? "category-nav__mega-menu max-w-[calc(100%-30px)] top-[calc(100%+4px)] left-[15px] right-[15px]" : "category-nav__submenu--no-mega min-w-[250px] left-0 top-[66px]"}`;
  }
  return `category-nav__submenu--level-1 ${hasNestedChildren ? "category-nav__mega-menu" : "category-nav__submenu--no-mega"}`;
}

function getSubmenuItemClass(hasChildren: boolean) {
  return `category-nav__submenu-item relative ${hasChildren ? "category-nav__submenu-item--mega-menu flex flex-wrap max-h-[calc(100vh-120px)] m-0 overflow-auto p-10" : "category-nav__submenu-item--not-child"}`;
}

function getSubmenuLinkClass(depth: number, hasChildren: boolean) {
  const base = "category-nav__submenu-link text-black w-full block uppercase focus:outline-none transition-colors hover:text-theme-primary";
  const parentClass = hasChildren ? "category-nav__submenu-link--parent font-bold mb-2.5 text-theme-primary text-lg leading-[1.1]" : "px-5 py-[7px] text-sm font-semibold leading-[1.3]";

  if (depth === 0) {
    return `${base} ${parentClass} ${hasChildren ? "category-nav__submenu-link--with-grandchild" : "category-nav__submenu-link--leaf"}`;
  }

  return `${base} ${parentClass} ${hasChildren ? "category-nav__submenu-link--nested-with-grandchild px-4 py-2" : "category-nav__submenu-link--nested-leaf px-4 py-2"}`;
}

function CategoryNavigationSubMenu({
  items,
  isOpen,
  id,
  onClose,
  depth,
}: {
  items: readonly NavigationItem[];
  isOpen: boolean;
  id: string;
  onClose: () => void;
  depth: number;
}) {
  const menuRef = useRef<HTMLUListElement>(null);
  const [openChildId, setOpenChildId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLElement>('[role="menuitem"]');
      first?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setOpenChildId(null);
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent, item: NavigationItem, index: number) => {
      const menu = menuRef.current;
      if (!menu) return;
      const focusable = getFocusableItems(menu).filter((el) => el.closest('[role="menu"]') === menu);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          focusable[(index + 1) % focusable.length]?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          focusable[(index - 1 + focusable.length) % focusable.length]?.focus();
          break;
        case "ArrowRight": {
          e.preventDefault();
          if (item.children?.length) setOpenChildId(item.id);
          break;
        }
        case "ArrowLeft":
          e.preventDefault();
          setOpenChildId(null);
          onClose();
          break;
        case "Escape":
          e.preventDefault();
          setOpenChildId(null);
          onClose();
          break;
        case "Home":
          e.preventDefault();
          focusable[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          focusable[focusable.length - 1]?.focus();
          break;
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  const submenuClassName = getSubmenuClassName(depth, items);
  const hasChildren = Boolean(items.some((child) => child.children && child.children.length > 0));

  return (
    <ul ref={menuRef} id={id} role="menu" aria-label="Submenu" className={submenuClassName}>
      {hasChildren ? (
        <li role="none" className={getSubmenuItemClass(hasChildren)}>
          <div aria-busy="true" className="megamenu-column lg-custom:w-full lg-custom:columns-5 xl-custom:columns-7 xl-custom:-mx-[5px]">
            {items.map((child, index) => {
              const childMenuId = `${id}-sub-${child.id}`;
              const childLinkClass = getSubmenuLinkClass(depth, hasChildren);

              return (
                <div key={child.id} className="megamenu-column pb-7.5 px-[5px] break-inside-avoid [&_ul_li_a]:px-0">
                  <h4 className="megamenu-heading">
                    <Link
                      href={plpHrefFromMagentoCategoryUrlPath(child.url_path)}
                      role="menuitem"
                      tabIndex={-1}
                      className={childLinkClass}
                      onKeyDown={(e) => handleKeyDown(e, child, index)}
                    >
                      {child.name}
                    </Link>
                  </h4>

                  {child.children && child.children.length > 0 && (
                    <CategoryNavigationSubMenu
                      items={child.children}
                      isOpen={isOpen}
                      id={childMenuId}
                      onClose={() => setOpenChildId(null)}
                      depth={depth + 1}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </li>
      ) : (
        items.map((child, index) => {
          const childItemClass = getSubmenuItemClass(hasChildren);
          const childLinkClass = getSubmenuLinkClass(depth, hasChildren);

          return (
            <li key={child.id} role="none" className={childItemClass}>
              <Link
                href={plpHrefFromMagentoCategoryUrlPath(child.url_path)}
                role="menuitem"
                tabIndex={-1}
                className={childLinkClass}
                onKeyDown={(e) => handleKeyDown(e, child, index)}
              >
                {child.name}
              </Link>
            </li>
          );
        })
      )}
    </ul>
  );
}

export default function CategoryNavDesktop({ items }: CategoryNavigationMenuProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeAll = useCallback(() => {
    setOpenId(null);
  }, []);

  useClickOutside(navRef, closeAll);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = useCallback((catId: number) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenId(catId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenId(null);
    }, 150);
  }, []);

  const handleTopLevelKeyDown = useCallback(
    (e: ReactKeyboardEvent, cat: NavigationItem, index: number) => {
      const nav = navRef.current;
      if (!nav) return;
      const topItems = getFocusableItems(nav).filter((el) => el.closest('[role="menubar"]') === nav);

      switch (e.key) {
        case "ArrowRight": {
          e.preventDefault();
          const next = (index + 1) % topItems.length;
          topItems[next]?.focus();
          setOpenId(null);
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          const prev = (index - 1 + topItems.length) % topItems.length;
          topItems[prev]?.focus();
          setOpenId(null);
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          if (cat.children?.length) setOpenId(cat.id);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setOpenId(null);
          break;
        }
        case "Escape":
          e.preventDefault();
          setOpenId(null);
          (e.target as HTMLElement).blur();
          break;
        case "Enter":
        case " ": {
          if (cat.children?.length) {
            e.preventDefault();
            setOpenId((prev) => (prev === cat.id ? null : cat.id));
          }
          break;
        }
        case "Home":
          e.preventDefault();
          topItems[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          topItems[topItems.length - 1]?.focus();
          break;
      }
    },
    [],
  );

  return (
    <ul ref={navRef} role="menubar" aria-label="Product categories" className="hidden items-center gap-x-7.5 lg-custom:flex">
      {items.map((cat, index) => {
        const hasChildren = Boolean(cat.children && cat.children.length > 0);
        const hasChildWithinChild = Boolean(cat.children?.some((child) => child.children && child.children.length > 0));
        const topLevelItemClass = getTopLevelItemClass(hasChildren, hasChildWithinChild);
        const isOpen = openId === cat.id;
        const menuId = `cat-menu-${cat.id}`;

        return (
          <li
            key={cat.id}
            role="none"
            className={topLevelItemClass}
            onMouseEnter={() => (hasChildren ? handleMouseEnter(cat.id) : undefined)}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href={plpHrefFromMagentoCategoryUrlPath(cat.url_path)}
              role="menuitem"
              aria-haspopup={hasChildren ? "menu" : undefined}
              aria-expanded={hasChildren ? isOpen : undefined}
              aria-controls={hasChildren ? menuId : undefined}
              tabIndex={index === 0 ? 0 : -1}
              className="category-nav__link flex items-center gap-1 text-sm font-bold leading-[1.3] text-theme-header-fg transition-colors hover:text-theme-primary focus:outline-none focus-visible:text-theme-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-theme-primary whitespace-nowrap"
              onKeyDown={(e) => handleTopLevelKeyDown(e, cat, index)}
              onFocus={() => {
                if (hasChildren) handleMouseEnter(cat.id);
              }}
            >
              {cat.name}
              {hasChildren && (
                <i
                  className={`icon-back-arrow text-sm leading-none before:font-bold transition-transform ${isOpen ? "rotate-90" : "-rotate-90"}`}
                  aria-hidden="true"
                />
              )}
            </Link>
            {hasChildren && (
              <CategoryNavigationSubMenu
                items={cat.children!}
                isOpen={isOpen}
                id={menuId}
                onClose={() => {
                  setOpenId(null);
                  const nav = navRef.current;
                  if (nav) {
                    const topItems = getFocusableItems(nav).filter((el) => el.closest('[role="menubar"]') === nav);
                    topItems[index]?.focus();
                  }
                }}
                depth={0}
              />
            )}
          </li>
        );
      })}

      <li role="none" className="category-nav__item">
        <Link
          href="/contact-us"
          className="whitespace-nowrap text-sm font-bold leading-[1.3] text-theme-header-fg transition-colors hover:text-theme-primary focus:outline-none focus-visible:text-theme-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-theme-primary"
        >
          Contact Us
        </Link>
      </li>
    </ul>
  );
}
