"use client";

import { useParams } from "next/navigation";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import { OrderDetailContent } from "@/src/components/account/order/OrderDetailContent";

export default function OrderDetailPage() {
  const params = useParams();
  const raw = params?.orderNumber;
  const segment = Array.isArray(raw) ? raw[0] : raw;
  const orderNumber = segment ? decodeURIComponent(segment) : "";

  if (!orderNumber) {
    return (
      <div className="space-y-4">
        <AccountPageTitle />
        <p className="text-gray-700">Invalid order link.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AccountPageTitle />
      <OrderDetailContent orderNumber={orderNumber} />
    </div>
  );
}
