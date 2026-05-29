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

type NavigationItem = {
  readonly id: number;
  readonly name: string;
  readonly url_path: string | null;
  readonly children?: readonly NavigationItem[];
};

type CategoryNavigationMenuProps = {
  items: readonly NavigationItem[];
};

function getFocusableItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
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
      const focusable = getFocusableItems(menu).filter(
        (el) => el.closest('[role="menu"]') === menu,
      );

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

  return (
    <ul
      ref={menuRef}
      id={id}
      role="menu"
      aria-label="Submenu"
      className={
        depth === 0
          ? "absolute left-0 top-full z-50 min-w-[220px] bg-white shadow-lg border border-gray-200 py-2 category-nav__mega-menu category-nav__submenu category-nav__submenu--level-0"
          : "absolute left-full top-0 z-50 min-w-[220px] bg-white shadow-lg border border-gray-200 py-2 category-nav__mega-menu category-nav__submenu category-nav__submenu--level-1"
      }
    >
      {items.map((child, index) => {
        const hasChildren = child.children && child.children.length > 0;
        const childMenuId = `${id}-sub-${child.id}`;
        const isChildOpen = openChildId === child.id;

        return (
          <li key={child.id} role="none" className="category-nav__submenu-item relative">
            <Link
              href={plpHrefFromMagentoCategoryUrlPath(child.url_path)}
              role="menuitem"
              aria-haspopup={hasChildren ? "menu" : undefined}
              aria-expanded={hasChildren ? isChildOpen : undefined}
              tabIndex={-1}
              className="category-nav__submenu-link flex items-center justify-between text-sm p-2 leading-[1.3] text-black hover:bg-theme-primary hover:text-white focus-visible:bg-theme-primary focus-visible:text-white focus:outline-none transition-colors whitespace-nowrap"
              onKeyDown={(e) => handleKeyDown(e, child, index)}
              onMouseEnter={() =>
                hasChildren ? setOpenChildId(child.id) : setOpenChildId(null)
              }
              onMouseLeave={() => setOpenChildId(null)}
            >
              {child.name}
              {hasChildren && (
                <i
                  className="icon-back-arrow text-sm leading-none before:font-bold ml-2 shrink-0 rotate-180"
                  aria-hidden="true"
                />
              )}
            </Link>
            {hasChildren && (
              <div
                onMouseEnter={() => setOpenChildId(child.id)}
                onMouseLeave={() => setOpenChildId(null)}
              >
                <CategoryNavigationSubMenu
                  items={child.children!}
                  isOpen={isChildOpen}
                  id={childMenuId}
                  onClose={() => {
                    setOpenChildId(null);
                    const menu = menuRef.current;
                    if (menu) {
                      const focusable = getFocusableItems(menu).filter(
                        (el) => el.closest('[role="menu"]') === menu,
                      );
                      focusable[index]?.focus();
                    }
                  }}
                  depth={depth + 1}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function CategoryNavigationMenu({ items }: CategoryNavigationMenuProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLUListElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMegaMenu = items.some((item) => (item.children?.length ?? 0) > 0);

  const closeAll = useCallback(() => {
    setOpenId(null);
    setMobileMenuOpen(false);
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
    (
      e: ReactKeyboardEvent,
      cat: NavigationItem,
      index: number,
    ) => {
      const nav = navRef.current;
      if (!nav) return;
      const topItems = getFocusableItems(nav).filter(
        (el) => el.closest('[role="menubar"]') === nav,
      );

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

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
    setOpenId(null);
  }, []);

  const toggleMobileCategory = useCallback((catId: number) => {
    setOpenId((prev) => (prev === catId ? null : catId));
  }, []);

  return (
    <div className={`category-nav ${hasMegaMenu ? "category-nav--mega" : "category-nav--simple"}`}>
      <div className="category-nav__mobile-header md:hidden">
        <button
          type="button"
          className="category-nav__mobile-toggle flex w-full items-center justify-between rounded border border-theme-header-border bg-theme-header-bg px-4 py-3 text-left text-sm font-bold text-theme-header-fg transition hover:border-theme-primary hover:text-theme-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary"
          aria-controls="category-nav-mobile-menu"
          aria-expanded={mobileMenuOpen}
          onClick={toggleMobileMenu}
        >
          Browse categories
          <i
            className={`icon-back-arrow text-sm leading-none before:font-bold transition-transform ${mobileMenuOpen ? "rotate-90" : "-rotate-90"}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <ul
        id="category-nav-mobile-menu"
        className={`category-nav__menu-list category-nav__menu-list--simple-menu ${mobileMenuOpen ? "block" : "hidden"} space-y-2 py-3 md:hidden`}
      >
        {items.map((cat) => {
          const hasChildren = cat.children && cat.children.length > 0;
          const isOpen = openId === cat.id;

          return (
            <li key={cat.id} className="category-nav__item border-b border-theme-header-border pb-2">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={plpHrefFromMagentoCategoryUrlPath(cat.url_path)}
                  className="category-nav__link text-sm font-semibold text-theme-header-fg hover:text-theme-primary transition-colors"
                >
                  {cat.name}
                </Link>
                {hasChildren && (
                  <button
                    type="button"
                    className="category-nav__toggle text-theme-header-fg hover:text-theme-primary focus:outline-none"
                    aria-expanded={isOpen}
                    aria-controls={`mobile-submenu-${cat.id}`}
                    onClick={() => toggleMobileCategory(cat.id)}
                  >
                    {isOpen ? "−" : "+"}
                  </button>
                )}
              </div>
              {hasChildren && isOpen && (
                <ul
                  id={`mobile-submenu-${cat.id}`}
                  className="category-nav__submenu category-nav__submenu--mobile mt-2 space-y-1 pl-4"
                >
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={plpHrefFromMagentoCategoryUrlPath(child.url_path)}
                        className="category-nav__submenu-link text-sm text-theme-header-fg hover:text-theme-primary transition-colors"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <ul
        ref={navRef}
        role="menubar"
        aria-label="Product categories"
        className={`category-nav__menu-list ${hasMegaMenu ? "category-nav__menu-list--mega-menu" : "category-nav__menu-list--simple-menu"} hidden items-center gap-x-7.5 md:flex`}
        data-menu={hasMegaMenu ? "mega" : "simple"}
      >
        {items.map((cat, index) => {
          const hasChildren = cat.children && cat.children.length > 0;
          const isOpen = openId === cat.id;
          const menuId = `cat-menu-${cat.id}`;

          return (
            <li
              key={cat.id}
              role="none"
              className="category-nav__item relative"
              onMouseEnter={() =>
                hasChildren ? handleMouseEnter(cat.id) : undefined
              }
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
                      const topItems = getFocusableItems(nav).filter(
                        (el) => el.closest('[role="menubar"]') === nav,
                      );
                      topItems[index]?.focus();
                    }
                  }}
                  depth={0}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
