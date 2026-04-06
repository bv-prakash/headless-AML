"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import Button from "@/src/components/common/Button";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { logout } from "@/src/store/slices/authSlice";
import { updateCompare, clearCompare } from "@/src/store/slices/compareSlice";
import { setWishlistCount, clearWishlist } from "@/src/store/slices/wishlistSlice";
import { setCart, setCartId, openMinicart, clearCart } from "@/src/store/slices/cartSlice";
import { CART_ID_KEY } from "@/src/constants/storageKeys";
import { getStoredValue, setStoredValue, removeStoredValue } from "@/src/utils/storage";
import { getErrorMessage, isAuthError } from "@/src/utils/errors";
import {
  ADD_TO_CART_MUTATION,
  CREATE_EMPTY_CART_MUTATION,
  type AddToCartResponse,
  type AddToCartVariables,
  type CreateEmptyCartResponse,
} from "@/src/framework/graphql/mutations/cartMutations";
import {
  ADD_TO_COMPARE_LIST_MUTATION,
  CREATE_COMPARE_LIST_MUTATION,
  type CreateCompareListResponse,
  type CreateCompareListVariables,
  type AddToCompareListResponse,
  type AddToCompareListVariables,
} from "@/src/framework/graphql/mutations/compareMutations";
import {
  ADD_TO_WISHLIST_MUTATION,
  type AddToWishlistResponse,
  type AddToWishlistVariables,
} from "@/src/framework/graphql/mutations/wishlistMutations";

type ProductActionsProps = {
  readonly sku: string;
  readonly productId: number;
  readonly productName: string;
  readonly productType?: string;
  readonly stockStatus: string;
  readonly overrideStyles?: string;
};

const DEFAULT_WISHLIST_ID = "0";

export default function ProductActions({
  sku,
  productId,
  productName,
  productType,
  stockStatus,
  overrideStyles,
}: ProductActionsProps) {
  const isOutOfStock = stockStatus === "OUT_OF_STOCK";
  const isConfigurable = productType === "ConfigurableProduct";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const [cartLoading, setCartLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [createEmptyCart] = useMutation<CreateEmptyCartResponse>(
    CREATE_EMPTY_CART_MUTATION,
  );
  const [addToCart] = useMutation<AddToCartResponse, AddToCartVariables>(
    ADD_TO_CART_MUTATION,
  );
  const [createCompareList] = useMutation<
    CreateCompareListResponse,
    CreateCompareListVariables
  >(CREATE_COMPARE_LIST_MUTATION);
  const [addToCompareList] = useMutation<
    AddToCompareListResponse,
    AddToCompareListVariables
  >(ADD_TO_COMPARE_LIST_MUTATION);
  const [addToWishlist] = useMutation<
    AddToWishlistResponse,
    AddToWishlistVariables
  >(ADD_TO_WISHLIST_MUTATION);

  const storeCartId = useAppSelector((state) => state.cart.cartId);

  const createFreshCart = useCallback(async (): Promise<string | null> => {
    const { data: emptyCartData } = await createEmptyCart();
    const newId = emptyCartData?.createEmptyCart ?? null;
    if (newId) {
      dispatch(setCartId(newId));
    }
    return newId;
  }, [createEmptyCart, dispatch]);

  const handleAddToCart = useCallback(async () => {
    if (isOutOfStock) return;
    if (isConfigurable) {
      toast.info("Please select product options on the product page.");
      return;
    }

    setCartLoading(true);
    try {
      let cartId = storeCartId ?? getStoredValue(CART_ID_KEY);

      if (!cartId) {
        cartId = await createFreshCart();
      }

      if (!cartId) {
        toast.error("Could not create cart. Please try again.");
        return;
      }

      try {
        const { data: cartData } = await addToCart({
          variables: { cartId, sku, quantity: 1 },
        });
        const updatedCart = cartData?.addSimpleProductsToCart?.cart;
        if (updatedCart) {
          dispatch(setCart(updatedCart));
        }
        dispatch(openMinicart());
        toast.success(`${productName} added to cart.`);
      } catch (innerErr) {
        const innerMsg = getErrorMessage(innerErr, "");
        const isStaleCart =
          innerMsg.toLowerCase().includes("cannot perform operations on cart") ||
          innerMsg.toLowerCase().includes("could not find a cart");

        if (isStaleCart) {
          dispatch(clearCart());
          cartId = await createFreshCart();
          if (!cartId) {
            toast.error("Could not create cart. Please try again.");
            return;
          }
          const { data: retryData } = await addToCart({
            variables: { cartId, sku, quantity: 1 },
          });
          const retryCart = retryData?.addSimpleProductsToCart?.cart;
          if (retryCart) {
            dispatch(setCart(retryCart));
          }
          dispatch(openMinicart());
          toast.success(`${productName} added to cart.`);
        } else {
          throw innerErr;
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add to cart."));
    } finally {
      setCartLoading(false);
    }
  }, [sku, productName, isConfigurable, isOutOfStock, storeCartId, addToCart, createFreshCart, dispatch]);

  const compareUid = useAppSelector((state) => state.compare.uid);

  const createFreshCompareList = useCallback(async (): Promise<boolean> => {
    const { data } = await createCompareList({
      variables: { products: [productId] },
    });
    const result = data?.createCompareList;
    if (result?.uid) {
      dispatch(updateCompare({ uid: result.uid, itemCount: result.item_count ?? 1 }));
      return true;
    }
    return false;
  }, [productId, createCompareList, dispatch]);

  const handleAddToCompare = useCallback(async () => {
    setCompareLoading(true);
    try {
      if (compareUid) {
        try {
          const { data } = await addToCompareList({
            variables: { uid: compareUid, products: [productId] },
          });
          const result = data?.addProductsToCompareList;
          if (result?.item_count) {
            dispatch(updateCompare({ uid: result.uid, itemCount: result.item_count }));
          } else {
            dispatch(clearCompare());
            await createFreshCompareList();
          }
        } catch {
          dispatch(clearCompare());
          await createFreshCompareList();
        }
      } else {
        await createFreshCompareList();
      }

      toast.success(
        <span className="text-base">
          {productName} added to compare.{" "}
          <a href="/compare" className="underline font-semibold">
            View
          </a>
        </span>,
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add to compare."));
    } finally {
      setCompareLoading(false);
    }
  }, [compareUid, productId, productName, addToCompareList, createFreshCompareList, dispatch]);

  const handleAddToWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to add items to your wishlist.");
      router.push("/sign-in");
      return;
    }

    setWishlistLoading(true);
    try {
      const { data } = await addToWishlist({
        variables: {
          wishlistId: DEFAULT_WISHLIST_ID,
          wishlistItems: [{ sku, quantity: 1 }],
        },
      });

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
      setWishlistLoading(false);
    }
  }, [sku, productName, isLoggedIn, addToWishlist, dispatch, router]);

  return (
    <div className={`product-item-actions mt-3 flex items-center justify-center gap-3 ${overrideStyles ? overrideStyles : ""}`}>
      <Button
        variant="secondary"
        size="md"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        loading={cartLoading}
        className={`flex-1 w-auto${isOutOfStock ? " cursor-not-allowed!" : ""}`}
        aria-label={
          isOutOfStock
            ? `${productName} is out of stock`
            : `Add ${productName} to cart`
        }
        title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
      >
        {isOutOfStock ? (
          <span className="text-red-600">Out of Stock</span>
        ) : (
          <>
            <span>Add to Cart</span>
            <i
              className="icon-cart text-base leading-none"
              aria-hidden="true"
            />
          </>
        )}
      </Button>

      <Button
        variant="secondary"
        size="icon"
        onClick={handleAddToCompare}
        loading={compareLoading}
        aria-label={`Add ${productName} to compare`}
        title="Add to Compare"
      >
        <i
          className="icon-compare text-base leading-none"
          aria-hidden="true"
        />
      </Button>

      <Button
        variant="secondary"
        size="icon"
        onClick={handleAddToWishlist}
        loading={wishlistLoading}
        aria-label={`Add ${productName} to wishlist`}
        title="Add to Wishlist"
      >
        <i
          className="icon-requisition-list text-base leading-none"
          aria-hidden="true"
        />
      </Button>
    </div>
  );
}
