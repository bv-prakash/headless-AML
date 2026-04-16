// Separate data export to prevent component recompilation
export const NAV_ITEMS: Array<{ href: string; label: string; pageTitle: string }> = [
  { href: "/account", label: "Dashboard", pageTitle: "Dashboard" },
  { href: "/account/profile", label: "Account Information", pageTitle: "Edit Account Information" },
  { href: "/account/addresses", label: "Address Book", pageTitle: "Address Book" },
  { href: "/account/orders", label: "My Orders", pageTitle: "My Orders" },
  { href: "/account/newsletter", label: "Newsletter Subscriptions", pageTitle: "Newsletter Subscriptions" },
  { href: "/account/wishlist", label: "Wishlist", pageTitle: "My Wishlist" },
];
