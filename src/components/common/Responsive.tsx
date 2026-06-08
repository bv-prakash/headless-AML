"use client";

import type { ReactNode } from "react";
import { useMediaQuery } from "@/src/hooks/useMediaQuery";

type ResponsiveProps = {
  query: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export function Responsive({ query, children, fallback = null }: ResponsiveProps) {
  const matches = useMediaQuery(query);
  return <>{matches ? children : fallback}</>;
}

export function ShowOnDesktop({ children, fallback = null,breakpoint = 1200 }: { children: ReactNode; fallback?: ReactNode; breakpoint?: number }) {
  return <Responsive query={`(min-width: ${breakpoint}px)`} fallback={fallback}>{children}</Responsive>;
}

export function ShowOnMobile({ children, fallback = null,breakpoint = 1199 }: { children: ReactNode; fallback?: ReactNode; breakpoint?: number }) {
  return <Responsive query={`(max-width: ${breakpoint}px)`} fallback={fallback}>{children}</Responsive>;
}
