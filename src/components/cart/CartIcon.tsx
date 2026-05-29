"use client";

import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import { openMinicart } from "@/src/store/slices/cartSlice";

export default function CartIcon() {
  const dispatch = useAppDispatch();
  const totalQuantity = useAppSelector((state) => state.cart.totalQuantity);

  return (
    <button
      type="button"
      onClick={() => dispatch(openMinicart())}
      className="relative flex items-center gap-1 hover:text-theme-primary transition-colors cursor-pointer"
      aria-label={`Shopping cart${totalQuantity > 0 ? ` (${totalQuantity} items)` : ""}`}
    >
      <i className="icon-cart text-[22px] leading-1" aria-hidden="true" />
      {totalQuantity > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-theme-primary rounded-full">
          {totalQuantity}
        </span>
      )}
    </button>
  );
}
