"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  getLanguageCodeForStoreView,
  getStoreViewOptionsForToggle,
  STORE_VIEW_OPTIONS,
  getWebsiteCodeForStoreView,
  type StoreViewOption,
} from "@/src/config/storeViews";
import { setAppLanguage, useLanguageTranslation } from "@/src/config/language";
import apolloClient from "@/src/framework/graphql/apolloClient";
import { writeStoreViewCookie } from "@/src/framework/store/storeViewCookie";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { logout } from "@/src/store/slices/authSlice";
import { clearCart, hydrateCart } from "@/src/store/slices/cartSlice";
import { clearCompare, hydrateCompare } from "@/src/store/slices/compareSlice";
import { clearWishlist, hydrateWishlist } from "@/src/store/slices/wishlistSlice";
import { setStoreViewCode } from "@/src/store/slices/storeViewSlice";
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
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState<PendingSwitch | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => detailsRef.current?.removeAttribute("open");
    const onPointerDown = (e: PointerEvent) => {
      if (!detailsRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const current = useMemo(
    () => STORE_VIEW_OPTIONS.find((o) => o.code === code) ?? STORE_VIEW_OPTIONS[0],
    [code],
  );
  const toggleOptions = useMemo(
    () => getStoreViewOptionsForToggle(code, language),
    [code, language],
  );

  const applyStore = useCallback(
    (next: string, prev: string, opts: { signOut: boolean; redirectTo?: string }) => {
      writeStoreViewCookie(next);
      dispatch(setStoreViewCode(next));
      setAppLanguage(getLanguageCodeForStoreView(next));

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

      /**
       * `resetStore` refetches active queries; any in-flight HTTP request is aborted
       * when `router.push` / `router.refresh` below unmounts a component. Apollo's
       * promise then rejects with `AbortError` — swallow it so Next's dev overlay
       * does not surface a spurious "Runtime AbortError: The operation was aborted."
       */
      void apolloClient
        .resetStore()
        .catch(() => {})
        .finally(() => {
          if (opts.redirectTo) {
            router.push(opts.redirectTo);
          } else {
            router.refresh();
          }
        });
    },
    [dispatch, router],
  );

  const pick = useCallback(
    (nextCode: string) => {
      detailsRef.current?.removeAttribute("open");
      if (nextCode === code) return;

      const next =
        STORE_VIEW_OPTIONS.find((o) => o.code === nextCode) ?? STORE_VIEW_OPTIONS[0];
      const prev =
        STORE_VIEW_OPTIONS.find((o) => o.code === code) ?? STORE_VIEW_OPTIONS[0];
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

  return (
    <>
    <details
      ref={detailsRef}
      className="relative shrink-0 group z-50"
      onToggle={(e) => setMenuOpen(e.currentTarget.open)}
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded border border-theme-header-border px-2.5 py-1.5 text-xs bg-white text-black shadow-sm opacity-95 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary [&::-webkit-details-marker]:hidden"
        aria-label="Store view"
      >
        <span className="hidden font-semibold sm:inline">Store</span>
        <span className="max-w-[120px] truncate sm:max-w-[200px]" title={`${current.group} — ${current.label}`}>
          {current.group}
        </span>
        <i
          className="icon-back-arrow text-sm leading-none before:font-bold transition-transform -rotate-90 opacity-70"
          aria-hidden
        />
      </summary>
      <ul
        className="absolute right-0 mt-1 max-h-72 min-w-[min(100vw-2rem,280px)] overflow-auto rounded border border-aaa bg-white py-1 shadow-lg sm:min-w-[280px]"
        role="listbox"
        aria-label="Choose store view"
      >
        {toggleOptions.map((o) => (
          <li key={o.code} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={o.code === code}
              className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-xs transition-colors hover:bg-f0f0f0 ${
                o.code === code ? "bg-f0f0f0 font-semibold text-black" : "text-gray-800"
              }`}
              onClick={() => pick(o.code)}
            >
              <span className="font-semibold text-black">{o.group}</span>
              <span className="text-[11px] leading-snug text-gray-600">{o.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </details>
    {pending ? (
      <StoreSwitchConfirmDialog
        pending={pending}
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />
    ) : null}
    </>
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
