"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type NavItem = {
  readonly id: number;
  readonly name: string;
  readonly url_path: string | null;
  readonly children?: readonly NavItem[];
};

type CategoryNavClientProps = {
  items: readonly NavItem[];
};

function getFocusableItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  );
}

function SubMenu({
  items,
  isOpen,
  id,
  onClose,
  depth,
}: {
  items: readonly NavItem[];
  isOpen: boolean;
  id: string;
  onClose: () => void;
  depth: number;
}) {
  const menuRef = useRef<HTMLUListElement>(null);
  const [openChildId, setOpenChildId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLElement>(
        '[role="menuitem"]',
      );
      first?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setOpenChildId(null);
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent, item: NavItem, index: number) => {
      const menu = menuRef.current;
      if (!menu) return;
      const focusable = getFocusableItems(menu).filter(
        (el) => el.closest('[role="menu"]') === menu,
      );

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = (index + 1) % focusable.length;
          focusable[next]?.focus();
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = (index - 1 + focusable.length) % focusable.length;
          focusable[prev]?.focus();
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          const hasChildren = item.children && item.children.length > 0;
          if (hasChildren) {
            setOpenChildId(item.id);
          }
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
        case "Home": {
          e.preventDefault();
          focusable[0]?.focus();
          break;
        }
        case "End": {
          e.preventDefault();
          focusable[focusable.length - 1]?.focus();
          break;
        }
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
          ? "absolute left-0 top-full z-50 min-w-[220px] bg-white shadow-lg border border-gray-200 py-2"
          : "absolute left-full top-0 z-50 min-w-[220px] bg-white shadow-lg border border-gray-200 py-2"
      }
    >
      {items.map((child, index) => {
        const hasChildren = child.children && child.children.length > 0;
        const childMenuId = `${id}-sub-${child.id}`;
        const isChildOpen = openChildId === child.id;

        return (
          <li key={child.id} role="none" className="relative">
            <Link
              href={`/products/${child.url_path ?? ""}`}
              role="menuitem"
              aria-haspopup={hasChildren ? "menu" : undefined}
              aria-expanded={hasChildren ? isChildOpen : undefined}
              tabIndex={-1}
              className="flex items-center justify-between text-sm p-2 leading-[1.3] text-black hover:bg-theme-primary hover:text-white focus-visible:bg-theme-primary focus-visible:text-white focus:outline-none transition-colors whitespace-nowrap"
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
                <SubMenu
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

export default function CategoryNavClient({ items }: CategoryNavClientProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const closeAll = useCallback(() => {
    setOpenId(null);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        closeAll();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeAll]);

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
      cat: NavItem,
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
          const hasChildren = cat.children && cat.children.length > 0;
          if (hasChildren) {
            setOpenId(cat.id);
          }
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
          const hasChildren = cat.children && cat.children.length > 0;
          if (hasChildren) {
            e.preventDefault();
            setOpenId((prev) => (prev === cat.id ? null : cat.id));
          }
          break;
        }
        case "Home": {
          e.preventDefault();
          topItems[0]?.focus();
          break;
        }
        case "End": {
          e.preventDefault();
          topItems[topItems.length - 1]?.focus();
          break;
        }
      }
    },
    [],
  );

  return (
    <ul
      ref={navRef}
      role="menubar"
      aria-label="Product categories"
      className="flex items-center gap-x-7.5"
    >
      {items.map((cat, index) => {
        const hasChildren = cat.children && cat.children.length > 0;
        const isOpen = openId === cat.id;
        const menuId = `cat-menu-${cat.id}`;

        return (
          <li
            key={cat.id}
            role="none"
            className="relative"
            onMouseEnter={() =>
              hasChildren ? handleMouseEnter(cat.id) : undefined
            }
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href={`/products/${cat.url_path ?? ""}`}
              role="menuitem"
              aria-haspopup={hasChildren ? "menu" : undefined}
              aria-expanded={hasChildren ? isOpen : undefined}
              aria-controls={hasChildren ? menuId : undefined}
              tabIndex={index === 0 ? 0 : -1}
              className="flex items-center gap-1 text-sm font-bold text-black leading-[1.3] hover:text-theme-primary focus-visible:text-theme-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-theme-primary focus:outline-none transition-colors whitespace-nowrap"
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
              <SubMenu
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
  );
}
