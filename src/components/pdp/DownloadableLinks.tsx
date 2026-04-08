"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { useAppSelector } from "@/src/store/hooks";
import { toast } from "react-toastify";
import { useAddToCart } from "@/src/hooks/useAddToCart";
import { formatPrice } from "@/src/utils/format";
import AddToCartActions from "@/src/components/common/AddToCartActions";
import {
  ADD_DOWNLOADABLE_TO_CART_MUTATION,
  type AddDownloadableToCartResponse,
  type AddDownloadableToCartVariables,
} from "@/src/framework/graphql/mutations/cartMutations";
import type {
  DownloadableLink,
  DownloadableSample,
} from "@/src/framework/graphql/queries/productDetail";

type DownloadableLinksProps = {
  readonly sku: string;
  readonly productId: number;
  readonly productName: string;
  readonly links?: readonly DownloadableLink[] | null;
  readonly samples?: readonly DownloadableSample[] | null;
};

export default function DownloadableLinks({ sku, productId, productName, links, samples }: DownloadableLinksProps) {
  const quantity = useAppSelector((s) => s.cart.quantities[sku] ?? 1);
  const { execute, loading } = useAddToCart(productName);

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
    <div className="downloadable-links flex flex-col gap-5">
      {hasLinks && (
        <div>
          <h3 className="text-base font-bold uppercase text-gray-800 mb-3">Downloads</h3>
          <ul className="space-y-2">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex items-center gap-3 py-2 px-3 border border-gray-200 rounded-md"
              >
                <input
                  type="checkbox"
                  id={`dl-link-${link.id}`}
                  checked={selectedLinkIds.has(link.id)}
                  onChange={() => toggleLink(link.id)}
                  className="accent-theme-primary w-4 h-4 shrink-0 cursor-pointer"
                />
                <label htmlFor={`dl-link-${link.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-gray-800">
                    {link.title}
                  </span>
                  <div className="flex items-center gap-3">
                    {link.price > 0 && (
                      <span className="text-sm font-semibold text-theme-secondary">
                        +{formatPrice(link.price, "USD")}
                      </span>
                    )}
                    {link.sample_url && (
                      <a
                        href={link.sample_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-theme-primary underline hover:no-underline"
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
        <div>
          <h3 className="text-base font-bold uppercase text-gray-800 mb-3">Samples</h3>
          <ul className="space-y-1.5">
            {samples.map((sample) => (
              <li key={sample.title}>
                {sample.sample_url ? (
                  <a
                    href={sample.sample_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-theme-primary underline hover:no-underline"
                  >
                    {sample.title}
                  </a>
                ) : (
                  <span className="text-sm text-gray-600">{sample.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <AddToCartActions
        itemKey={sku}
        sku={sku}
        productId={productId}
        productName={productName}
        disabled={selectedLinkIds.size === 0}
        loading={loading}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
