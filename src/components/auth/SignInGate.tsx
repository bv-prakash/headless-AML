"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/src/store/hooks";
import { selectAuthHydrated, selectIsLoggedIn } from "@/src/store/selectors";
import { safeRedirectPath } from "@/src/utils/safeRedirectPath";

type SignInGateProps = {
  readonly children: ReactNode;
};

function AuthShellLoading() {
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

/**
 * If the customer is already signed in, redirects to `redirect` or home instead of showing the login form.
 */
export default function SignInGate({ children }: SignInGateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useAppSelector(selectAuthHydrated);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const redirectTarget = safeRedirectPath(searchParams.get("redirect"), "/");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !hydrated || !isLoggedIn) return;
    router.replace(redirectTarget);
  }, [mounted, hydrated, isLoggedIn, redirectTarget, router]);

  if (!mounted || !hydrated) {
    return <AuthShellLoading />;
  }

  if (isLoggedIn) {
    return (
      <div className="text-center py-16 text-gray-600" role="status">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
