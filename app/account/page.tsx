import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";

export default function MyAccountDashboardPage() {
  return (
    <div className="space-y-3">
      <AccountPageTitle />
      <p className="text-gray-700">
        Welcome to your account dashboard. Use the navigation on the left to view
        your profile, addresses, and orders.
      </p>
    </div>
  );
}

