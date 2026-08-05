"use client";

import dynamic from "next/dynamic";
import PageLoader from "@/src/components/common/loader/PageLoader";

/** `ssr: false` must live in a Client Component — cart/auth use localStorage after mount */
const CheckoutContent = dynamic(
  () => import("@/src/components/checkout/CheckoutContent"),
  {
    ssr: false,
    loading: () => (
      <PageLoader label="Loading checkout…" minHeightClassName="min-h-[40vh]" />
    ),
  },
);

export default function CheckoutClientLoader() {
  return <CheckoutContent />;
}
