import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { updateCompare, clearCompare } from "@/src/store/slices/compareSlice";
import { invalidateCustomerSession } from "@/src/framework/graphql/invalidateCustomerSession";
import { getErrorMessage, isCustomerSessionInvalidError } from "@/src/utils/errors";
import {
  CREATE_COMPARE_LIST_MUTATION,
  type CreateCompareListResponse,
  type CreateCompareListVariables,
} from "@/src/framework/graphql/compare/mutations/createCompareList";
import {
  ADD_TO_COMPARE_LIST_MUTATION,
  type AddToCompareListResponse,
  type AddToCompareListVariables,
} from "@/src/framework/graphql/compare/mutations/addToCompareList";

export function useAddToCompare(productId: number, productName: string) {
  const dispatch = useAppDispatch();
  const compareUid = useAppSelector((s) => s.compare.uid);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [createCompareList] = useMutation<
    CreateCompareListResponse,
    CreateCompareListVariables
  >(CREATE_COMPARE_LIST_MUTATION);

  const [addToCompareList] = useMutation<
    AddToCompareListResponse,
    AddToCompareListVariables
  >(ADD_TO_COMPARE_LIST_MUTATION);

  const createFreshList = useCallback(async (): Promise<boolean> => {
    const { data } = await createCompareList({
      variables: { products: [productId] },
    });
    const result = data?.createCompareList;
    if (result?.uid) {
      dispatch(
        updateCompare({ uid: result.uid, itemCount: result.item_count ?? 1 }),
      );
      return true;
    }
    return false;
  }, [productId, createCompareList, dispatch]);

  const execute = useCallback(async () => {
    setLoading(true);
    try {
      if (compareUid) {
        try {
          const { data } = await addToCompareList({
            variables: { uid: compareUid, products: [productId] },
          });
          const result = data?.addProductsToCompareList;
          if (result?.item_count) {
            dispatch(
              updateCompare({
                uid: result.uid,
                itemCount: result.item_count,
              }),
            );
          } else {
            dispatch(clearCompare());
            await createFreshList();
          }
        } catch {
          dispatch(clearCompare());
          await createFreshList();
        }
      } else {
        await createFreshList();
      }

      if (!mountedRef.current) return;

      toast.success(
        <span className="text-base">
          {productName} added to compare.{" "}
          <a href="/compare" className="underline font-semibold">
            View
          </a>
        </span>,
      );
    } catch (err) {
      if (!mountedRef.current) return;
      if (isCustomerSessionInvalidError(err)) {
        invalidateCustomerSession();
        return;
      }
      toast.error(getErrorMessage(err, "Failed to add to compare."));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [
    compareUid,
    productId,
    productName,
    addToCompareList,
    createFreshList,
    dispatch,
  ]);

  return { execute, loading };
}
