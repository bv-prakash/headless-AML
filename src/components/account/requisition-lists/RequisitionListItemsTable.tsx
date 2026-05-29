"use client";

import { memo, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import type { RequisitionListItem } from "@/src/framework/graphql/requisition-lists/types";
import { formatRequisitionListPrice } from "@/src/components/account/requisition-lists/requisitionListUtils";

type RequisitionListItemsTableProps = {
  readonly items?: ReadonlyArray<RequisitionListItem> | null;
  readonly selectedUids: ReadonlySet<string>;
  readonly removingItemUids: ReadonlySet<string>;
  readonly pendingQty: ReadonlyMap<string, number>;
  readonly onToggleSelect: (itemUid: string, checked: boolean) => void;
  readonly onToggleSelectAll: (checked: boolean) => void;
  readonly onQtyChange: (itemUid: string, qty: number) => void;
  readonly onRemoveItem: (itemUid: string) => void;
};

const FALLBACK_IMAGE = "/img/no-image.png";

/**
 * Header / cell utilities matching `DashboardRecentOrders` (and the
 * Requisition Lists listing grid). Keeping the constants identical means
 * any future Luma-admin tweak (border colour, padding, etc.) flows through
 * one place per file.
 */
const TH = "px-4 py-3 text-left font-bold uppercase bg-f0f0f0 border-b-2 border-aaa";
const TD = "px-4 py-3 border-b border-aaa align-top";

const EmptyState = memo(function EmptyState() {
  return (
    <p className="text-sm text-gray-600 m-0">
      This requisition list has no items yet.
    </p>
  );
});
EmptyState.displayName = "EmptyState";

function productHref(item: RequisitionListItem): string | null {
  const key = item.product?.url_key;
  return key ? `/${key}` : null;
}

function unitPrice(item: RequisitionListItem): string {
  const price = item.product?.price_range?.minimum_price?.final_price;
  return formatRequisitionListPrice(price?.value, price?.currency);
}

function subtotal(item: RequisitionListItem, qty: number): string {
  const price = item.product?.price_range?.minimum_price?.final_price;
  if (price?.value == null) return "—";
  return formatRequisitionListPrice(price.value * qty, price.currency);
}

const ItemRow = memo(function ItemRow({
  item,
  index,
  selected,
  removing,
  qty,
  onToggleSelect,
  onQtyChange,
  onRemove,
}: {
  item: RequisitionListItem;
  index: number;
  selected: boolean;
  removing: boolean;
  qty: number;
  onToggleSelect: (itemUid: string, checked: boolean) => void;
  onQtyChange: (itemUid: string, qty: number) => void;
  onRemove: (itemUid: string) => void;
}) {
  const href = productHref(item);
  const imgUrl = item.product?.small_image?.url || FALLBACK_IMAGE;
  const imgAlt = item.product?.small_image?.label || item.product?.name || "Product";
  const stock = (item.product?.stock_status ?? "").toUpperCase();
  const outOfStock = stock !== "" && stock !== "IN_STOCK";
  const checkboxId = `requisition-item-${item.uid}`;

  const decrease = () => onQtyChange(item.uid, Math.max(1, qty - 1));
  const increase = () => onQtyChange(item.uid, qty + 1);

  return (
    <tr
      className={`item${removing ? " opacity-50" : ""}`}
      data-product-id={item.product?.uid ?? ""}
    >
      <td data-th="#" className={`col number ${TD}`}>
        {index + 1}
      </td>
      <td data-th="Select" className={`col col-checkbox ${TD}`}>
        <input
          id={checkboxId}
          type="checkbox"
          className="input-checkbox"
          checked={selected}
          onChange={(e) => onToggleSelect(item.uid, e.target.checked)}
          aria-label={`Select ${item.product?.name ?? "item"}`}
          data-role="select-item"
        />
      </td>
      <td data-th="Item" className={`col product ${TD}`}>
        <div className="flex items-start gap-3">
          <div className="product-item-image shrink-0 w-16 h-16 relative border border-f0f0f0 bg-white">
            <Image src={imgUrl} alt={imgAlt} fill sizes="64px" className="object-contain" unoptimized />
          </div>
          <div className="product-item-description min-w-0">
            <strong className="product-item-name block font-medium leading-tight">
              {href ? (
                <Link href={href} className="text-theme-primary hover:underline">
                  {item.product?.name ?? "Unnamed product"}
                </Link>
              ) : (
                item.product?.name ?? "Unnamed product"
              )}
            </strong>
            <div className="product-item-sku text-xs text-gray-500 mt-1">
              <b>SKU:</b> <span>{item.product?.sku ?? "—"}</span>
            </div>
            {outOfStock ? (
              <div className="message error item-error text-xs text-light-red mt-1">
                <span>The SKU is out of stock.</span>
              </div>
            ) : null}
          </div>
        </div>
      </td>
      <td data-th="UOM" className={`col uom ${TD}`}>
        Each
      </td>
      <td data-th="Price" className={`col price ${TD}`}>
        <span className="price">{unitPrice(item)}</span>
      </td>
      <td data-th="Qty" className={`col qty ${TD}`}>
        <div className="control qty inline-flex items-center border border-ccc">
          <button
            type="button"
            className="decrease-qty px-2 py-1 hover:bg-f4f4f4 disabled:opacity-50"
            onClick={decrease}
            disabled={removing || qty <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            id={`item-${item.uid}-qty`}
            name={`qty[${item.uid}]`}
            type="number"
            min={1}
            value={qty}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next) && next > 0) onQtyChange(item.uid, next);
            }}
            className="input-text w-14 text-center border-x border-ccc px-2 py-1 focus:outline-none"
            data-role="requisition-item-qty"
          />
          <button
            type="button"
            className="increase-qty px-2 py-1 hover:bg-f4f4f4 disabled:opacity-50"
            onClick={increase}
            disabled={removing}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </td>
      <td data-th="Subtotal" className={`col subtotal action ${TD}`}>
        <div className="product-item-subtotal flex flex-col items-start gap-1">
          <span className="price">{subtotal(item, qty)}</span>
          <button
            type="button"
            onClick={() => onRemove(item.uid)}
            disabled={removing}
            className="action action-delete text-light-red hover:underline disabled:opacity-50 text-xs"
          >
            {removing ? "Removing…" : "Remove item"}
          </button>
        </div>
      </td>
    </tr>
  );
});
ItemRow.displayName = "RequisitionListItemRow";

function RequisitionListItemsTableComponent({
  items,
  selectedUids,
  removingItemUids,
  pendingQty,
  onToggleSelect,
  onToggleSelectAll,
  onQtyChange,
  onRemoveItem,
}: RequisitionListItemsTableProps) {
  const selectAllId = useId();

  if (!items || items.length === 0) {
    return <EmptyState />;
  }

  const allSelected = items.length > 0 && items.every((it) => selectedUids.has(it.uid));
  const someSelected = !allSelected && items.some((it) => selectedUids.has(it.uid));

  return (
    <div className="table-wrapper requisition-list-items overflow-x-auto w-full">
      <table
        className="data table table-order-items recent w-full border-collapse border border-aaa"
        id="requisition-list-items-table"
      >
        <caption className="table-caption sr-only">Requisition list items</caption>
        <thead>
          <tr>
            <th scope="col" className={`col number ${TH}`}>
              #
            </th>
            <th scope="col" className={`col col-checkbox ${TH}`}>
              <input
                id={selectAllId}
                type="checkbox"
                className="input-checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                aria-label="Select all items"
                data-role="select-all"
              />
            </th>
            <th scope="col" className={`col product ${TH}`}>
              Item
            </th>
            <th scope="col" className={`col uom ${TH}`}>
              UOM
            </th>
            <th scope="col" className={`col price ${TH}`}>
              Price
            </th>
            <th scope="col" className={`col qty ${TH}`}>
              Qty
            </th>
            <th scope="col" className={`col subtotal action ${TH}`}>
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const qty = pendingQty.get(item.uid) ?? item.quantity;
            return (
              <ItemRow
                key={item.uid}
                item={item}
                index={idx}
                selected={selectedUids.has(item.uid)}
                removing={removingItemUids.has(item.uid)}
                qty={qty}
                onToggleSelect={onToggleSelect}
                onQtyChange={onQtyChange}
                onRemove={onRemoveItem}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const RequisitionListItemsTable = memo(RequisitionListItemsTableComponent);
RequisitionListItemsTable.displayName = "RequisitionListItemsTable";
