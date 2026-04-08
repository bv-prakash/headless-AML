"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { logout } from "@/src/store/slices/authSlice";
import { clearWishlist } from "@/src/store/slices/wishlistSlice";
import { clearCart } from "@/src/store/slices/cartSlice";
import { clearCompare } from "@/src/store/slices/compareSlice";
import { useClickOutside } from "@/src/hooks/useClickOutside";
import {
  REVOKE_CUSTOMER_TOKEN_MUTATION,
  type RevokeCustomerTokenResponse,
} from "@/src/framework/graphql/mutations/authMutations";

export default function HeaderAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const customer = useAppSelector((state) => state.auth.customer);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [revokeToken] = useMutation<RevokeCustomerTokenResponse>(
    REVOKE_CUSTOMER_TOKEN_MUTATION,
  );

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown, dropdownOpen);

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false);
    try {
      await revokeToken();
    } catch {
      // Token may already be expired — proceed with local cleanup
    }
    dispatch(logout());
    dispatch(clearWishlist());
    dispatch(clearCart());
    dispatch(clearCompare());
    toast.success("You have been signed out.");
    router.push("/");
  }, [dispatch, revokeToken, router]);

  const handleUserClick = useCallback(() => {
    if (!isLoggedIn) {
      router.push("/sign-in");
      return;
    }
    setDropdownOpen((prev) => !prev);
  }, [isLoggedIn, router]);

  const handleDropdownLinkClick = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  const greeting = customer?.firstname
    ? `Hi, ${customer.firstname}`
    : "My Account";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleUserClick}
        className="flex items-center gap-1 cursor-pointer hover:text-theme-primary transition-colors"
        aria-expanded={isLoggedIn ? dropdownOpen : undefined}
        aria-haspopup={isLoggedIn ? "true" : undefined}
        aria-label={isLoggedIn ? greeting : "Sign In"}
      >
        <i
          className="icon-user-fill text-[26px] leading-1"
          aria-hidden="true"
        />
      </button>

      {isLoggedIn && dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
          <ul className="py-2 text-sm">
            <li>
              <Link
                href="/account"
                onClick={handleDropdownLinkClick}
                className="block px-4 py-2 hover:bg-gray-100 hover:text-theme-primary transition-colors"
              >
                My Account
              </Link>
            </li>
            <li>
              <Link
                href="/wishlist"
                onClick={handleDropdownLinkClick}
                className="block px-4 py-2 hover:bg-gray-100 hover:text-theme-primary transition-colors"
              >
                Wishlist
              </Link>
            </li>
            <li>
              <Link
                href="/orders"
                onClick={handleDropdownLinkClick}
                className="block px-4 py-2 hover:bg-gray-100 hover:text-theme-primary transition-colors"
              >
                My Orders
              </Link>
            </li>
            <li>
              <hr className="my-1 border-gray-200" />
            </li>
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 hover:text-theme-primary transition-colors cursor-pointer"
              >
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
