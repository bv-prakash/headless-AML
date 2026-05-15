"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import RequisitionListDetailContent from "@/src/components/account/requisitionList/RequisitionListDetailContent";

export default function RequisitionListDetailPage() {
  const params = useParams();
  const raw = params?.uid;
  const segment = Array.isArray(raw) ? raw[0] : raw;
  const uid = segment ? decodeURIComponent(segment) : "";

  if (!uid) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold m-0">Invalid requisition list link</h1>
        <Link
          href="/account/requisition-lists"
          className="inline-block text-theme-primary underline"
        >
          Back to Requisition Lists
        </Link>
      </div>
    );
  }

  return <RequisitionListDetailContent uid={uid} />;
}
