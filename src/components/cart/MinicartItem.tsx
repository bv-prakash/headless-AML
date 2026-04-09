import { memo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/src/utils/format";
import QuantitySelector from "@/src/components/common/QuantitySelector";
import ConfigurableItemOptions from "@/src/components/cart/ConfigurableItemOptions";
import BundleItemOptions from "@/src/components/cart/BundleItemOptions";
import DownloadableItemOptions from "@/src/components/cart/DownloadableItemOptions";
import type { CartItem } from "@/src/framework/graphql/mutations/cartMutations";
import { buildProductEditHref } from "@/src/utils/params";

type ValidCartItem = CartItem & {
  product: NonNullable<CartItem["product"]>;
  prices: NonNullable<CartItem["prices"]>;
};

type MinicartItemProps = {
  readonly item: ValidCartItem;
  readonly isBusy: boolean;
  readonly onRemove: (uid: string, name: string) => void;
  readonly onUpdateQty: (uid: string, qty: number) => void;
  readonly onClose: () => void;
};

function MinicartItemInner({ item, isBusy, onRemove, onUpdateQty, onClose }: MinicartItemProps) {
  const handleRemove = useCallback(() => {
    onRemove(item.uid, item.product.name);
  }, [item.uid, item.product.name, onRemove]);

  const handleQtyChange = useCallback(
    (qty: number) => onUpdateQty(item.uid, qty),
    [item.uid, onUpdateQty],
  );

  return (
    <li
      className={`flex gap-3 pb-4 border-b border-gray-100 last:border-0 ${isBusy ? "opacity-60 pointer-events-none" : ""}`}
    >
      <div className="w-[100px] h-[100px] overflow-hidden">
        {item.product.small_image?.url ? (
          <Image
            src={item.product.small_image.url}
            alt={item.product.name}
            width={100}
            height={100}
            className="object-contain w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            No img
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-black line-clamp-2 mb-1">
          {item.product.name}
        </p>

        {item.configurable_options && <ConfigurableItemOptions options={item.configurable_options} />}
        {item.bundle_options && <BundleItemOptions options={item.bundle_options} />}
        {item.links && <DownloadableItemOptions links={item.links} />}

        <p className="text-sm text-gray-500 mt-1.5">
          SKU: {item.product.sku}
        </p>
        <p className="font-bold text-black mt-2">
          {formatPrice(item.prices.row_total.value, item.prices.row_total.currency)}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <QuantitySelector
            itemKey={`cart-${item.uid}`}
            defaultValue={item.quantity}
            disabled={isBusy}
            onChange={handleQtyChange}
            size="lg"
          />

          <div className="ml-auto flex items-center gap-3">
            <Link
              href={buildProductEditHref(
                item.product.url_key,
                item.product.sku,
                item.quantity,
              )}
              onClick={onClose}
              className="text-black hover:text-theme-primary transition-colors"
              aria-label={`Edit ${item.product.name}`}
            >
              <i className="icon-edit text-lg leading-1" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isBusy}
              className="text-black hover:text-theme-primary transition-colors cursor-pointer disabled:opacity-40"
              aria-label={`Remove ${item.product.name}`}
            >
              <i className="icon-trash text-xl leading-1" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

const MinicartItem = memo(MinicartItemInner);
export default MinicartItem;
