"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/src/store/hooks";
import { selectAuthHydrated, selectIsLoggedIn } from "@/src/store/selectors";

type RequireAuthProps = {
  readonly children: React.ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAppSelector(selectAuthHydrated);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !hydrated) return;
    if (isLoggedIn) return;
    router.replace("/");
  }, [mounted, hydrated, isLoggedIn, pathname, router]);

  if (!mounted || !hydrated) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-600">
        <div
          className="h-10 w-10 rounded-full border-[3px] border-gray-200 border-t-theme-primary animate-spin"
          aria-hidden
        />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center py-16 text-gray-600" role="status">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}

