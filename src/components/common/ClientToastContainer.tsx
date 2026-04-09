"use client";

import dynamic from "next/dynamic";

/** Loads react-toastify only on the client to avoid SSR / hydration mismatches. */
const ToastContainer = dynamic(
  () => import("@/src/components/common/ToastContainer"),
  { ssr: false },
);

export default function ClientToastContainer() {
  return <ToastContainer />;
}
