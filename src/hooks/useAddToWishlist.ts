import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { logout } from "@/src/store/slices/authSlice";
import { setWishlistCount, clearWishlist } from "@/src/store/slices/wishlistSlice";
import { getErrorMessage, isAuthError } from "@/src/utils/errors";
import {
  ADD_TO_WISHLIST_MUTATION,
  type AddToWishlistResponse,
  type AddToWishlistVariables,
} from "@/src/framework/graphql/mutations/wishlistMutations";

const DEFAULT_WISHLIST_ID = "0";

export function useAddToWishlist(sku: string, productName: string) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isLoggedIn = useAppSelector((s) => s.auth.isLoggedIn);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [addToWishlist] = useMutation<
    AddToWishlistResponse,
    AddToWishlistVariables
  >(ADD_TO_WISHLIST_MUTATION);

  const execute = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to add items to your wishlist.");
      router.push("/sign-in");
      return;
    }

    setLoading(true);
    try {
      const { data } = await addToWishlist({
        variables: {
          wishlistId: DEFAULT_WISHLIST_ID,
          wishlistItems: [{ sku, quantity: 1 }],
        },
      });

      if (!mountedRef.current) return;

      const wishlistResult = data?.addProductsToWishlist;
      const errors = wishlistResult?.user_errors;
      if (errors?.length) {
        toast.error(errors[0].message);
        return;
      }

      const newCount = wishlistResult?.wishlist?.items_count;
      if (newCount != null) {
        dispatch(setWishlistCount(newCount));
      }

      toast.success(`${productName} added to wishlist.`);
    } catch (err) {
      if (!mountedRef.current) return;
      const message = getErrorMessage(err, "Failed to add to wishlist.");
      if (isAuthError(message)) {
        dispatch(logout());
        dispatch(clearWishlist());
        toast.error("Please sign in to add items to your wishlist.");
        router.push("/sign-in");
      } else {
        toast.error(message);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [sku, productName, isLoggedIn, addToWishlist, dispatch, router]);

  return { execute, loading };
}
