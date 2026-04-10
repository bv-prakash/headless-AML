import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";

export default function MyAccountAddressesPage() {
  return (
    <div className="space-y-3">
      <AccountPageTitle />
      <p className="text-gray-700">
        Saved addresses will go here. (We can reuse the checkout address form and
        `createCustomerAddress` mutation.)
      </p>
    </div>
  );
}

