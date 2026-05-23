"use client";

import { useParams } from "next/navigation";
import RoleFormPage from "@/src/components/account/roles-and-permissions/RoleFormPage";

export default function MyAccountEditRolePage() {
  const params = useParams();
  const raw = params?.roleId;
  const segment = Array.isArray(raw) ? raw[0] : raw;
  const roleId = segment ? decodeURIComponent(segment) : "";

  if (!roleId) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl leading-[1.1] mb-5 mt-0 font-semibold md:text-[26px] lg-custom:text-[32px]! uppercase border-b border-aaa pt-2.5 md:pt-0 pb-[15px]">
          Edit Role
        </h1>
        <p className="text-gray-700">Invalid role link.</p>
      </div>
    );
  }

  return <RoleFormPage mode="edit" roleId={roleId} />;
}
