import type { B2BFeatureKey } from "@/src/framework/graphql/queries/storeConfigB2BFeatures";

export type AccountNavItem = {
  readonly href: string;
  readonly label: string;
  readonly pageTitle: string;
  /**
   * Optional B2B gate. Items without `requires` are always shown; items with
   * `requires` are rendered only when {@link useB2BNavGating} reports that
   * feature as enabled (store config flag, or customer company membership).
   */
  readonly requires?: B2BFeatureKey;
};

export const NAV_ITEMS: ReadonlyArray<AccountNavItem> = [
  { href: "/account", label: "Dashboard", pageTitle: "Dashboard" },
  { href: "/account/profile", label: "Account Information", pageTitle: "Edit Account Information" },
  { href: "/account/addresses", label: "Address Book", pageTitle: "Address Book" },
  { href: "/account/orders", label: "My Orders", pageTitle: "My Orders" },
  { href: "/account/newsletter", label: "Newsletter Subscriptions", pageTitle: "Newsletter Subscriptions" },
  { href: "/account/wishlist", label: "Wishlist", pageTitle: "My Wishlist" },
  { href: "/account/requisition-lists", label: "Requisition Lists", pageTitle: "Requisition Lists", requires: "requisitionLists" },
  { href: "/account/company-profile", label: "Company Profile", pageTitle: "Company Profile", requires: "company" },
  { href: "/account/company-structure", label: "Company Structure", pageTitle: "Company Structure", requires: "company" },
  { href: "/account/company-users", label: "Company Users", pageTitle: "Company Users", requires: "company" },
  { href: "/account/roles-and-permissions", label: "Roles and Permissions", pageTitle: "Roles and Permissions", requires: "company" },
];
