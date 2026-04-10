import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";

export default function MyAccountProfilePage() {
  return (
    <div className="space-y-3">
      <AccountPageTitle />
      <p className="text-gray-700">
        Profile details will go here (name, email, password change, etc.).
      </p>
    </div>
  );
}

