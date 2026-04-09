"use client";

import Link from "next/link";
import CheckoutForm from "@/src/components/checkout/CheckoutForm";
import ClientOnly from "@/src/components/common/ClientOnly";
import { useAppSelector } from "@/src/store/hooks";
import { selectAuthHydrated, selectIsLoggedIn } from "@/src/store/selectors";

export default function CheckoutContent() {
  const hydrated = useAppSelector(selectAuthHydrated);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return (
    <div className="">
      <h1 className="text-2xl md:text-3xl font-bold text-black uppercase mb-2">
        Checkout
      </h1>

      {/* Avoid SSR vs client mismatch on auth-dependent copy — render after mount only */}
      <ClientOnly>
        {hydrated && !isLoggedIn && (
          <>
            <p className="text-gray-600 mb-2">
              Step through shipping and delivery, then payment. Order summary stays
              on the right. Sign in for a faster experience next time.
            </p>
            <p className="text-sm text-gray-600 mb-8">
              <Link
                href={`/sign-in?${new URLSearchParams({ redirect: "/checkout" }).toString()}`}
                className="text-theme-primary font-semibold underline hover:no-underline"
              >
                Sign in
              </Link>{" "}
              (optional)
            </p>
          </>
        )}

        {hydrated && isLoggedIn && (
          <p className="text-gray-600 mb-8">
            First confirm shipping and delivery. Then choose payment on the next
            step. Your order summary is always visible in the sidebar.
          </p>
        )}
      </ClientOnly>

      <CheckoutForm />
    </div>
  );
}
