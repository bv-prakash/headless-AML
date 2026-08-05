"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import { setCompareCount } from "@/src/store/slices/compareSlice";
import {
  COMPARE_LIST_QUERY,
  type CompareListQueryResponse,
  type CompareListQueryVariables,
} from "@/src/framework/graphql/compare/queries/getCompareList";

export default function CompareIcon({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const compareUid = useAppSelector((state) => state.compare.uid);
  const itemCount = useAppSelector((state) => state.compare.itemCount);
  const prevDataRef = useRef<CompareListQueryResponse | undefined>(undefined);

  const { data } = useQuery<
    CompareListQueryResponse,
    CompareListQueryVariables
  >(COMPARE_LIST_QUERY, {
    variables: { uid: compareUid ?? "" },
    skip: !compareUid,
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (data === prevDataRef.current) return;
    prevDataRef.current = data;
    if (!data?.compareList) return;
    dispatch(setCompareCount(data.compareList.item_count));
  }, [data, dispatch]);

  return (
    <Link
      href="/compare"
      className={`relative flex items-center gap-1 hover:text-theme-primary transition-colors ${className}`}
      aria-label={`Compare products${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
    >
      <i className="icon-compare text-[22px] leading-1" aria-hidden="true" />
      {itemCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-theme-primary rounded-full">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
