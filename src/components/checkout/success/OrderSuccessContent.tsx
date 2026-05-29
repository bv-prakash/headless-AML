"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ORDER_NUMBER_QUERY_PARAM } from "@/src/constants/checkoutRoutes";

export default function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get(ORDER_NUMBER_QUERY_PARAM)?.trim() ?? "";

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className="rounded-lg border border-aaa bg-f0f0f0 p-6 md:p-10 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 mb-5">
          <i className="icon-check text-2xl leading-none" aria-hidden />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-black uppercase mb-3">
          Thank you for your order
        </h1>
        <p className="text-gray-700 text-base md:text-lg mb-6">
          {orderNumber ? (
            <>
              Your order number is{" "}
              <span className="font-semibold text-black tabular-nums">
                {orderNumber}
              </span>
              . We&apos;ve received your order and will send a confirmation email
              shortly.
            </>
          ) : (
            <>
              We&apos;ve received your order and will send a confirmation email
              shortly.
            </>
          )}
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center font-semibold h-11 px-6 text-base bg-theme-primary text-white border border-theme-primary hover:opacity-90 transition-opacity uppercase"
          >
            Continue shopping
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center font-semibold h-11 px-6 text-base border border-aaa bg-white text-gray-800 hover:bg-theme-primary hover:text-white hover:border-theme-primary transition-colors uppercase"
          >
            View orders
          </Link>
        </div>
      </div>
    </div>
  );
}
