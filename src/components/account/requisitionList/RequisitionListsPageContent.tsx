"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import { AccountPager } from "@/src/components/common/AccountPager";
import PageLoader from "@/src/components/common/PageLoader";
import { CreateRequisitionListModal } from "@/src/components/account/requisitionList/CreateRequisitionListModal";
import { RequisitionListsTable } from "@/src/components/account/requisitionList/RequisitionListsTable";
import {
  CUSTOMER_REQUISITION_LISTS_QUERY,
  type CustomerRequisitionListsResponse,
  type CustomerRequisitionListsVariables,
} from "@/src/framework/graphql/requisition-lists/queries/getCustomerRequisitionLists";
import { getErrorMessage } from "@/src/utils/errors";
import {
  buildListPaginationQueryString,
  LUMA_ACCOUNT_LIST_PAGINATION,
  parseListPaginationParams,
  totalPagesFor,
} from "@/src/utils/listPagination";

export default function RequisitionListsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [createOpen, setCreateOpen] = useState(false);

  const { page, pageSize } = useMemo(
    () => parseListPaginationParams(searchParams, LUMA_ACCOUNT_LIST_PAGINATION),
    [searchParams],
  );

  const variables = useMemo<CustomerRequisitionListsVariables>(
    () => ({ currentPage: page, pageSize }),
    [page, pageSize],
  );

  const { data, loading, error, refetch } = useQuery<
    CustomerRequisitionListsResponse,
    CustomerRequisitionListsVariables
  >(CUSTOMER_REQUISITION_LISTS_QUERY, {
    variables,
    fetchPolicy: "cache-and-network",
  });

  const rawRows = data?.customer?.requisition_lists?.items ?? null;
  const totalCount = data?.customer?.requisition_lists?.total_count ?? 0;
  const totalPages = totalPagesFor(totalCount, pageSize);

  /**
   * Magento's `requisition_lists` query has no `sort` argument (only
   * pageSize / currentPage / filter), so we sort the current page's rows
   * client-side by `updated_at` descending — newest activity first.
   * Caveat: this sorts the rows fetched for this page only; if you exceed
   * one page, the global ordering depends on whatever default order
   * Magento returns.
   */
  const rows = useMemo(() => {
    if (!rawRows) return null;
    return [...rawRows].sort((a, b) => {
      const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return tb - ta;
    });
  }, [rawRows]);

  useEffect(() => {
    if (loading || totalCount <= 0) return;
    if (page > totalPages) {
      router.replace(
        `${pathname}?${buildListPaginationQueryString(totalPages, pageSize, LUMA_ACCOUNT_LIST_PAGINATION)}`,
        { scroll: false },
      );
    }
  }, [loading, totalCount, page, totalPages, pageSize, pathname, router]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AccountPageTitle />
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-block py-2 px-4 text-sm font-bold uppercase bg-theme-primary text-white hover:opacity-90"
        >
          Create New Requisition List
        </button>
      </div>

      {loading && !rows?.length ? (
        <PageLoader label="Loading requisition lists…" minHeightClassName="min-h-[40vh]" />
      ) : null}

      {error ? (
        <div className="space-y-3">
          <p className="text-light-red" role="alert">
            {getErrorMessage(error, "Could not load your requisition lists.")}
          </p>
          <button
            type="button"
            className="text-sm text-theme-primary underline"
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <RequisitionListsTable rows={rows} />
          <AccountPager
            totalCount={totalCount}
            currentPage={page}
            pageSize={pageSize}
          />
        </>
      ) : null}

      <CreateRequisitionListModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void refetch()}
      />
    </div>
  );
}
