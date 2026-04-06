"use client";

import { useState, useEffect, type ReactNode } from "react";

type ClientOnlyProps = {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
};

/**
 * Renders `children` only after the client has mounted, preventing
 * hydration mismatches for any content that depends on browser-only
 * state (localStorage, Redux hydration, etc.).
 *
 * On the server (and during the initial client hydration pass)
 * it renders `fallback` (defaults to `null`).
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;

  return <>{children}</>;
}
