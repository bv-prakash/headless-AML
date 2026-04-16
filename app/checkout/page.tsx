import type { Metadata } from "next";
import { Breadcrumbs } from "@/src/components/common/Breadcrumbs";
import CheckoutClientLoader from "./CheckoutClientLoader";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your American Lighting order.",
};

export default function CheckoutPage() {
  return (
    <div className="container relative mb-[25px] mt-5 lg-custom:mb-7.5! lg-custom:mt-7.5!">
      <Breadcrumbs
        items={[
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
      />
      <CheckoutClientLoader />
    </div>
  );
}
