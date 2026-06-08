"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  getLanguageCodeForStoreView,
  getStoreViewOptionsForToggle,
  hydrateStoreViewOptionsFromMagento,
  STORE_VIEW_OPTIONS,
  getWebsiteCodeForStoreView,
  type StoreViewOption,
} from "@/src/config/storeViews";
import { useLanguageTranslation } from "@/src/config/language";
import {
  applyClientStoreViewState,
  refreshAfterStoreViewChange,
} from "@/src/framework/store/clientStoreViewSwitch";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { logout } from "@/src/store/slices/authSlice";
import { clearCart, hydrateCart } from "@/src/store/slices/cartSlice";
import { clearCompare, hydrateCompare } from "@/src/store/slices/compareSlice";
import { clearWishlist, hydrateWishlist } from "@/src/store/slices/wishlistSlice";
import { selectStoreViewCode } from "@/src/store/selectors";

type PendingSwitch = {
  readonly next: StoreViewOption;
  readonly prev: StoreViewOption;
  /** `true` when the user is currently signed in — we must log them out before switching website. */
  readonly requiresSignOut: boolean;
};

/**
 * Header store-view dropdown: syncs cookie + localStorage + Redux, re-hydrates cart /
 * compare / wishlist from the new website's scoped storage (Magento rejects cross-website
 * cart mutations), resets Apollo, and refreshes RSC so CMS / nav / PDP server data match
 * the Magento `Store` header.
 */
export default function StoreViewToggle() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const code = useAppSelector(selectStoreViewCode);
  const { language } = useLanguageTranslation();
  const isLoggedIn = useAppSelector((s) => s.auth.isLoggedIn);
  const [pending, setPending] = useState<PendingSwitch | null>(null);
  const [storeViewsRevision, setStoreViewsRevision] = useState(0);

  useEffect(() => {
    void hydrateStoreViewOptionsFromMagento().then(() => {
      setStoreViewsRevision((prev) => prev + 1);
    });
  }, []);


  const current = useMemo(
    () => STORE_VIEW_OPTIONS.find((o) => o.code === code) ?? STORE_VIEW_OPTIONS[0],
    [code, storeViewsRevision],
  );
  const toggleOptions = useMemo(
    () => getStoreViewOptionsForToggle(code, language),
    [code, language, storeViewsRevision],
  );

  const applyStore = useCallback(
    (next: string, prev: string, opts: { signOut: boolean; redirectTo?: string }) => {
      const storeChanged = applyClientStoreViewState({
        dispatch,
        nextStoreViewCode: next,
        currentStoreViewCode: prev,
        nextLanguageCode: getLanguageCodeForStoreView(next),
      });
      if (!storeChanged) return;

      const websiteChanged =
        getWebsiteCodeForStoreView(next) !== getWebsiteCodeForStoreView(prev);

      if (opts.signOut) {
        /**
         * Customer accounts are website-scoped in Magento — an American Lighting
         * session is invalid on Proluxe. Clear customer + website-scoped client
         * state before sending the user to the sign-in page.
         */
        dispatch(logout());
        dispatch(clearCart());
        dispatch(clearCompare());
        dispatch(clearWishlist());
      } else if (websiteChanged) {
        /**
         * Guest switching websites: cart / compare / wishlist are scoped by website
         * in local storage, so re-hydrate to the new website's state. This also
         * prevents Magento's "Can't assign cart to store in different website".
         */
        dispatch(hydrateCart());
        dispatch(hydrateCompare());
        dispatch(hydrateWishlist());
      }

      refreshAfterStoreViewChange(router, { redirectTo: opts.redirectTo });
    },
    [dispatch, router],
  );

  const pick = useCallback(
    (nextCode: string) => {
      if (nextCode === code) return;

      const next =
        STORE_VIEW_OPTIONS.find((o) => o.code === nextCode) ?? STORE_VIEW_OPTIONS[0];
      const prev =
        STORE_VIEW_OPTIONS.find((o) => o.code === code) ?? STORE_VIEW_OPTIONS[0];
      if (!next || !prev) return;
      const websiteChanged =
        getWebsiteCodeForStoreView(next.code) !==
        getWebsiteCodeForStoreView(prev.code);

      /**
       * Same-website store view switch — no prompt, just apply. Within one website
       * cart / compare / wishlist remain valid.
       */
      if (!websiteChanged) {
        applyStore(next.code, prev.code, { signOut: false });
        return;
      }

      /**
       * Cross-website switch → always confirm. If signed in, we also warn that it
       * will sign the user out because Magento customer sessions are per-website.
       */
      setPending({ next, prev, requiresSignOut: isLoggedIn });
    },
    [applyStore, code, isLoggedIn],
  );

  const confirmPending = useCallback(() => {
    if (!pending) return;
    const { next, prev, requiresSignOut } = pending;
    setPending(null);

    if (requiresSignOut) {
      applyStore(next.code, prev.code, {
        signOut: true,
        redirectTo: `/sign-in?reason=store_changed&store=${encodeURIComponent(next.group)}`,
      });
      toast.info(`Signed out — sign in again to shop ${next.group}.`);
    } else {
      applyStore(next.code, prev.code, { signOut: false });
      toast.info(`You're now shopping on ${next.group}.`);
    }
  }, [pending, applyStore]);

  const cancelPending = useCallback(() => {
    setPending(null);
  }, []);

  if (!current) return null;

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        {toggleOptions.map((o) => (
          <button
            key={o.code}
            type="button"
            className={`flex items-center justify-between rounded border px-3 py-2  text-sm transition duration-150 ${
              o.code === code
                ? "border-theme-primary bg-theme-primary text-white"
                : "border-gray-200 bg-white text-gray-800 hover:border-theme-primary hover:bg-gray-50"
            }`}
            onClick={() => pick(o.code)}
          >
            <span>{o.group}</span>
          </button>
        ))}
      </div>
      {pending ? (
        <StoreSwitchConfirmDialog
          pending={pending}
          onConfirm={confirmPending}
          onCancel={cancelPending}
        />
      ) : null}
    </div>
  );
}

function StoreSwitchConfirmDialog({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: PendingSwitch;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-switch-title"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="store-switch-title" className="text-lg font-semibold text-black">
          Switch store to {pending.next.group}?
        </h2>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <p>
            You're leaving <strong>{pending.prev.group}</strong> for{" "}
            <strong>{pending.next.group}</strong>. These are separate stores, so the
            catalog, prices, cart, wishlist, and compare list will all change to match{" "}
            {pending.next.group}.
          </p>
          {pending.requiresSignOut ? (
            <p>
              Customer accounts are specific to each store. You'll be signed out and
              taken to the sign-in page for <strong>{pending.next.group}</strong>. Use
              the credentials registered on that store to sign back in.
            </p>
          ) : (
            <p>
              Any items in your current cart will stay with <strong>{pending.prev.group}</strong>
              {" "}and will be there when you switch back.
            </p>
          )}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 cursor-pointer bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Stay on {pending.prev.group}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-theme-primary cursor-pointer px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {pending.requiresSignOut
              ? `Sign out & switch to ${pending.next.group}`
              : `Switch to ${pending.next.group}`}
          </button>
        </div>
      </div>
    </div>
  );
}
