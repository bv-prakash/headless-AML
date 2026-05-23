"use client";

import { memo } from "react";
import Link from "next/link";
import type { RequisitionListRow } from "@/src/framework/graphql/requisition-lists/types";
import { formatRequisitionListActivity } from "@/src/components/account/requisitionList/requisitionListUtils";

type RequisitionListsTableProps = {
  readonly rows?: ReadonlyArray<RequisitionListRow> | null;
};

/**
 * Header/cell utilities lifted verbatim from `DashboardRecentOrders` so the
 * Requisition Lists grid renders with the same Luma-admin visual rhythm
 * (zebra-free, uppercase headers, `border-aaa` outlining, mobile `data-th`
 * stack-on-collapse labels).
 */
const TH = "px-4 py-3 text-left font-bold uppercase bg-f0f0f0 border-b-2 border-aaa";
const TD = "px-4 py-3 border-b border-aaa";

const EmptyState = memo(function EmptyState() {
  return (
    <p className="text-sm text-gray-600 m-0">
      You don&apos;t have any requisition lists yet.
    </p>
  );
});
EmptyState.displayName = "EmptyState";

const Row = memo(function Row({ row }: { row: RequisitionListRow }) {
  const href = `/account/requisition-lists/${encodeURIComponent(row.uid)}`;
  return (
    <tr>
      <td data-th="Name & Description" className={`col name ${TD}`}>
        <Link href={href} className="text-theme-primary hover:underline font-semibold">
          {row.name}
        </Link>
        {row.description ? (
          <div className="text-sm text-gray-600 mt-1">{row.description}</div>
        ) : null}
      </td>
      <td data-th="Items" className={`col items ${TD}`}>
        {row.items_count}
      </td>
      <td data-th="Latest Activity" className={`col activity ${TD}`}>
        {formatRequisitionListActivity(row.updated_at)}
      </td>
      <td data-th="Action" className={`col actions ${TD} text-start`}>
        <Link href={href} className="action view text-theme-primary hover:underline">
          <span>View</span>
        </Link>
      </td>
    </tr>
  );
});
Row.displayName = "RequisitionListRow";

function RequisitionListsTableComponent({ rows }: RequisitionListsTableProps) {
  if (!rows || rows.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="table-wrapper requisition-lists overflow-x-auto w-full">
      <table
        className="data table table-order-items recent w-full border-collapse border border-aaa"
        id="my-requisition-lists-table"
      >
        <caption className="table-caption sr-only">Requisition Lists</caption>
        <thead>
          <tr>
            <th scope="col" className={`col name ${TH}`}>
              Name &amp; Description
            </th>
            <th scope="col" className={`col items ${TH}`}>
              Items
            </th>
            <th scope="col" className={`col activity ${TH}`}>
              Latest Activity
            </th>
            <th scope="col" className={`col actions ${TH} text-center`}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row key={row.uid} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const RequisitionListsTable = memo(RequisitionListsTableComponent);
RequisitionListsTable.displayName = "RequisitionListsTable";
