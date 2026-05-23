import Image from "next/image";
import { formatPrice } from "@/src/utils/format";
import ConfigurableItemOptions from "@/src/components/cart/ConfigurableItemOptions";
import BundleItemOptions from "@/src/components/cart/BundleItemOptions";
import DownloadableItemOptions from "@/src/components/cart/DownloadableItemOptions";
import type { CartItem } from "@/src/framework/graphql/cart/types";

type ValidCartItem = CartItem & {
  product: NonNullable<CartItem["product"]>;
  prices: NonNullable<CartItem["prices"]>;
};

type CheckoutCartLineItemProps = {
  readonly item: ValidCartItem;
};

/** Read-only line display aligned with minicart product rows (no qty/edit/remove). */
export default function CheckoutCartLineItem({ item }: CheckoutCartLineItemProps) {
  return (
    <li className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
      <div className="w-[72px] h-[72px] shrink-0 overflow-hidden bg-gray-50 rounded">
        {item.product.small_image?.url ? (
          <Image
            src={item.product.small_image.url}
            alt={item.product.name}
            width={72}
            height={72}
            className="object-contain w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            —
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-black text-sm line-clamp-2 leading-snug">
          {item.product.name}
        </p>
        {item.configurable_options && (
          <ConfigurableItemOptions options={item.configurable_options} />
        )}
        {item.bundle_options && <BundleItemOptions options={item.bundle_options} />}
        {item.links && <DownloadableItemOptions links={item.links} />}
        <p className="text-xs text-gray-500 mt-1">SKU: {item.product.sku}</p>
        <p className="text-xs text-gray-600 mt-0.5">Qty: {item.quantity}</p>
        <p className="font-bold text-black text-sm mt-1.5">
          {formatPrice(item.prices.row_total.value, item.prices.row_total.currency)}
        </p>
      </div>
    </li>
  );
}
