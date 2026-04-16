"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import { setWishlistCount } from "@/src/store/slices/wishlistSlice";
import {
  CUSTOMER_WISHLIST_QUERY,
  type CustomerWishlistResponse,
  getActiveWishlist,
} from "@/src/framework/graphql/mutations/wishlistMutations";

export default function WishlistIcon() {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const itemCount = useAppSelector((state) => state.wishlist.itemCount);
  const prevDataRef = useRef<CustomerWishlistResponse | undefined>(undefined);

  const { data } = useQuery<CustomerWishlistResponse>(
    CUSTOMER_WISHLIST_QUERY,
    {
      skip: !isLoggedIn,
      fetchPolicy: "cache-and-network",
    },
  );

  useEffect(() => {
    if (data === prevDataRef.current) return;
    prevDataRef.current = data;
    const wl = getActiveWishlist(data);
    if (!wl) return;
    dispatch(setWishlistCount(wl.items_count));
  }, [data, dispatch]);

  if (!isLoggedIn) return null;

  return (
    <Link
      href="/account/wishlist"
      className="relative flex items-center gap-1 hover:text-theme-primary transition-colors"
      aria-label={`Wishlist${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
    >
      <i
        className="icon-requisition-list text-[26px] leading-1"
        aria-hidden="true"
      />
      {itemCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-theme-primary rounded-full">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
