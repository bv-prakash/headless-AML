import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CartContent = dynamic(
  () => import("@/src/components/cart/CartContent"),
);
import { Breadcrumbs } from "@/src/components/common/Breadcrumbs";

export const metadata: Metadata = {
  title: "Shopping Cart",
};

export default function CartPage() {
  return (
    <div className="container relative mb-[25px] mt-5 lg-custom:mb-7.5! lg-custom:mt-7.5!">
      <Breadcrumbs items={[{ label: "Shopping Cart" }]} />
      <h1 className="text-xl leading-[1.1] mb-5 mt-0 font-bold md:text-[26px] lg-custom:text-[32px]! lg-custom:mb-7.5!">
        Shopping Cart
      </h1>
      <CartContent />
    </div>
  );
}
