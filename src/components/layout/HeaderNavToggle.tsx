"use client";

import { useCallback, useState } from "react";

export default function HeaderNavToggle() {
  const [navOpen, setNavOpen] = useState(false);
  const handleToggleNav = useCallback(() => {
    window.dispatchEvent(new CustomEvent("toggle-category-nav"));
    setNavOpen((prev) => !prev);
  }, []);

  return (
    <button
      type="button"
      data-action="toggle-nav"
      aria-label="Toggle navigation"
      className={`action nav-toggle cursor-pointer block h-5 min-w-[23px] max-w-[23px] relative top-[2px] transition-transform duration-300 ease-in-out w-full z-50 ${navOpen ? "active z-[999]" : ""}`}
      onClick={handleToggleNav}
    >
      <span className={`line block absolute left-0 h-0.5 w-full transform transition-transform duration-300 ease-in-out origin-[left_center] bg-black opacity-100 top-[-1px] ${navOpen ? "rotate-45 top-[-1px]" : "rotate-0 top-[1px]"}`} />
      <span className={`line block abs h-0.5 origin-[left_center] transform transition-transform duration-300 ease-in-out bg-black top-2 ${navOpen ? "opacity-0 w-0" : "opacity-100 w-full rotate-0"}`} />
      <span className={`line block absolute left-0 h-0.5 w-full origin-[left_center] transform transition-transform duration-300 ease-in-out bg-black opacity-100 ${navOpen ? "-rotate-45 top-[15px]" : "rotate-0 top-[17px]"}`} />
    </button>
  );
}
