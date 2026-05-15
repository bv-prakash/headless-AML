"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { useAppSelector } from "@/src/store/hooks";
import { toast } from "react-toastify";
import { useAddToCart } from "@/src/hooks/useAddToCart";
import { formatPrice } from "@/src/utils/format";
import AddToCartActions from "@/src/components/common/AddToCartActions";
import {
  PDP_ADD_TO_CART_WRAP_CLASS,
  PDP_OPTIONS_BLOCK_CLASS,
  PDP_OPTION_LABEL_CLASS,
} from "@/src/components/pdp/pdpAddToCartSection";
import {
  ADD_DOWNLOADABLE_TO_CART_MUTATION,
  type AddDownloadableToCartResponse,
  type AddDownloadableToCartVariables,
} from "@/src/framework/graphql/mutations/cartMutations";
import type {
  DownloadableLink,
  DownloadableSample,
} from "@/src/framework/graphql/queries/productDetail";
import { encodeOptionUid } from "@/src/utils/magentoOptionUid";
import type { RequisitionListItemsInput } from "@/src/framework/graphql/mutations/requisitionListMutations";

type DownloadableLinksProps = {
  readonly sku: string;
  readonly productId: number;
  readonly productName: string;
  readonly links?: readonly DownloadableLink[] | null;
  readonly samples?: readonly DownloadableSample[] | null;
  readonly initialQty?: number | null;
};

export default function DownloadableLinks({
  sku,
  productId,
  productName,
  links,
  samples,
  initialQty = null,
}: DownloadableLinksProps) {
  const quantity = useAppSelector((s) => s.cart.quantities[sku] ?? initialQty ?? 1);
  const { execute, loading, prefetchCart } = useAddToCart(productName);

  const hasLinks = links && links.length > 0;
  const hasSamples = samples && samples.length > 0;

  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<number>>(() => {
    if (!hasLinks) return new Set();
    return new Set(links.map((l) => l.id));
  });

  const [addDownloadable] = useMutation<AddDownloadableToCartResponse, AddDownloadableToCartVariables>(
    ADD_DOWNLOADABLE_TO_CART_MUTATION,
  );

  const toggleLink = useCallback((linkId: number) => {
    setSelectedLinkIds((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
  }, []);

  /**
   * Magento encodes downloadable link picks as base64
   * `downloadable/<productId>/<linkId>` UIDs in `selected_options`.
   */
  const buildRequisitionItems = useCallback((): ReadonlyArray<RequisitionListItemsInput> => {
    return [
      {
        sku,
        selected_options: Array.from(selectedLinkIds).map((linkId) =>
          encodeOptionUid("downloadable", productId, linkId),
        ),
      },
    ];
  }, [sku, selectedLinkIds, productId]);

  const handleAddToCart = useCallback(() => {
    if (selectedLinkIds.size === 0) {
      toast.error("Please select at least one link.");
      return;
    }

    const linkInputs = Array.from(selectedLinkIds).map((link_id) => ({ link_id }));

    execute(async (cartId) => {
      const { data } = await addDownloadable({
        variables: { cartId, sku, quantity, links: linkInputs },
      });
      return data?.addDownloadableProductsToCart?.cart;
    });
  }, [selectedLinkIds, sku, quantity, addDownloadable, execute]);

  if (!hasLinks && !hasSamples) return null;

  return (
    <>
      <div className={`downloadable-links ${PDP_OPTIONS_BLOCK_CLASS}`}>
        {hasLinks && (
          <div className="flex flex-col gap-2.5">
            <div className={PDP_OPTION_LABEL_CLASS}>Downloads</div>
            <ul className="flex flex-col gap-2.5">
              {links.map((link) => (
                <li
                  key={link.id}
                  className="flex items-center gap-3 border border-black bg-white px-4 py-3"
                >
                  <input
                    type="checkbox"
                    id={`dl-link-${link.id}`}
                    checked={selectedLinkIds.has(link.id)}
                    onChange={() => toggleLink(link.id)}
                    className="accent-theme-primary w-4 h-4 shrink-0 cursor-pointer"
                  />
                  <label
                    htmlFor={`dl-link-${link.id}`}
                    className="flex flex-1 flex-wrap items-center justify-between gap-2 cursor-pointer text-sm font-medium text-black"
                  >
                    <span>{link.title}</span>
                    <div className="flex items-center gap-3">
                      {link.price > 0 && (
                        <span className="text-sm font-bold text-theme-secondary">
                          +{formatPrice(link.price, "USD")}
                        </span>
                      )}
                      {link.sample_url && (
                        <a
                          href={link.sample_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-theme-primary underline hover:no-underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Sample
                        </a>
                      )}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasSamples && (
          <div className="flex flex-col gap-2.5">
            <div className={PDP_OPTION_LABEL_CLASS}>Samples</div>
            <ul className="flex flex-col gap-2">
              {samples.map((sample) => (
                <li key={sample.title}>
                  {sample.sample_url ? (
                    <a
                      href={sample.sample_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-theme-primary underline hover:no-underline"
                    >
                      {sample.title}
                    </a>
                  ) : (
                    <span className="text-sm text-black">{sample.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={PDP_ADD_TO_CART_WRAP_CLASS}>
        <AddToCartActions
          itemKey={sku}
          sku={sku}
          productId={productId}
          productName={productName}
          disabled={selectedLinkIds.size === 0}
          loading={loading}
          onPrefetchCart={prefetchCart}
          onAddToCart={handleAddToCart}
          defaultQuantity={initialQty ?? undefined}
          variant="plp"
          showRequisitionButton
          buildRequisitionItems={buildRequisitionItems}
        />
      </div>
    </>
  );
}
