"use client";

import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import { WishlistPageContent } from "@/src/components/wishlist/WishlistPageContent";

export default function WishlistPage() {
  return (
    <div className="space-y-6">
      <AccountPageTitle />
      <WishlistPageContent />
    </div>
  );
}
