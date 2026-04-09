"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCheckoutForm } from "@/src/components/checkout/useCheckoutForm";
import CheckoutOrderSummary from "@/src/components/checkout/CheckoutOrderSummary";
import CheckoutStepIndicator from "@/src/components/checkout/CheckoutStepIndicator";
import CheckoutGuestEmail from "@/src/components/checkout/CheckoutGuestEmail";
import ShippingAddressFields from "@/src/components/checkout/ShippingAddressFields";
import BillingAddressFields from "@/src/components/checkout/BillingAddressFields";
import CheckoutSavedAddresses from "@/src/components/checkout/CheckoutSavedAddresses";
import CheckoutShippingMethods from "@/src/components/checkout/CheckoutShippingMethods";
import CheckoutPaymentPanel from "@/src/components/checkout/CheckoutPaymentPanel";
import CheckoutFormActions from "@/src/components/checkout/CheckoutFormActions";
import NewShippingAddressModal from "@/src/components/checkout/NewShippingAddressModal";
import CheckoutLoadingSpinner from "@/src/components/checkout/CheckoutLoadingSpinner";

export default function CheckoutForm() {
  const f = useCheckoutForm();

  let main: ReactNode = null;

  if (!f.checkoutStoreReady) {
    main = <CheckoutLoadingSpinner label="Loading checkout" />;
  } else if (!f.cartId) {
    main = (
      <p className="text-gray-600">
        Your cart is empty.{" "}
        <Link href="/cart" className="text-theme-primary font-semibold underline">
          View cart
        </Link>
      </p>
    );
  } else if (f.cartLoading) {
    main = <CheckoutLoadingSpinner />;
  } else if (f.emptyCartRedirect) {
    main = null;
  } else {
    main = (
      <div className="space-y-8">
        <CheckoutStepIndicator
          step={f.checkoutStep}
          onNavigateToShipping={
            f.checkoutStep === "payment" ? f.goBackToShippingStep : undefined
          }
        />

        {f.checkoutStep === "shipping" && (
          <>
            {!f.isLoggedIn && (
              <CheckoutGuestEmail
                value={f.guestEmail}
                onChange={f.setGuestEmail}
              />
            )}

            <section aria-labelledby="ship-addr-heading">
              <h2
                id="ship-addr-heading"
                className="text-lg font-semibold text-black uppercase mb-4 border-b border-aaa pb-2.5"
              >
                Shipping address
              </h2>

              {f.isLoggedIn && f.customerLoading && (
                <div className="flex items-center gap-3 py-6 text-gray-600">
                  <div
                    className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-theme-primary animate-spin"
                    aria-hidden
                  />
                  <span>Loading your addresses…</span>
                </div>
              )}

              {f.isLoggedIn &&
                !f.customerLoading &&
                f.savedAddresses.length > 0 &&
                !f.useNewShippingForm && (
                  <CheckoutSavedAddresses
                    savedAddresses={f.savedAddresses}
                    selectedSavedAddressId={f.selectedSavedAddressId}
                    onSelectAddress={f.onSelectSavedAddress}
                    onAddNew={f.onAddNewShippingAddress}
                  />
                )}

              {(!f.isLoggedIn ||
                (f.isLoggedIn &&
                  !f.customerLoading &&
                  f.savedAddresses.length === 0)) && (
                <ShippingAddressFields
                  shipping={f.shipping}
                  setShipping={f.setShipping}
                />
              )}
            </section>

            <div className="flex items-center gap-2">
              <input
                id="same-billing"
                type="checkbox"
                checked={f.sameBilling}
                onChange={(e) => f.setSameBilling(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-theme-primary"
              />
              <label htmlFor="same-billing" className="text-sm text-gray-800">
                Billing address same as shipping
              </label>
            </div>

            {!f.sameBilling && (
              <BillingAddressFields
                billing={f.billing}
                setBilling={f.setBilling}
                billingSaveBook={f.billingSaveBook}
                setBillingSaveBook={f.setBillingSaveBook}
              />
            )}

            <CheckoutShippingMethods
              loading={f.shippingRatesLoading}
              options={f.shippingOptions}
              selectedShipKey={f.selectedShipKey}
              onSelect={f.setSelectedShipKey}
            />
          </>
        )}

        {f.checkoutStep === "payment" && (
          <CheckoutPaymentPanel
            paymentOptions={f.paymentOptions}
            selectedPaymentCode={f.selectedPaymentCode}
            onSelectPayment={f.setSelectedPaymentCode}
            onBackToShipping={() => f.setCheckoutStep("shipping")}
          />
        )}

        <CheckoutFormActions
          checkoutStep={f.checkoutStep}
          shippingOptionsCount={f.shippingOptions.length}
          shippingRatesLoading={f.shippingRatesLoading}
          submitting={f.submitting}
          onNextToPayment={f.goToPaymentStep}
          onPlaceOrder={f.completeOrder}
        />
      </div>
    );
  }

  return (
    <>
      {f.showNewShippingAddressModal ? (
        <NewShippingAddressModal
          shipping={f.shipping}
          setShipping={f.setShipping}
          onClose={f.closeNewShippingAddressModal}
        />
      ) : null}

      {f.showSummarySidebar ? (
        <div className="lg:grid lg:grid-cols-[1fr_min(380px,40%)] xl:gap-10 lg:gap-8 items-start">
          <div className="min-w-0">{main}</div>
          <CheckoutOrderSummary
            step={f.checkoutStep}
            cart={f.cartData?.cart}
            selectedShippingLabel={f.selectedShippingSummary}
            shippingMethodTitle={f.selectedShippingMethodTitle}
            shippingAmount={f.selectedShippingAmount}
            shippingAddressSummary={f.shippingAddressSummaryText}
            onEditShippingAddress={f.goBackToShippingStep}
            onEditShippingMethod={f.goBackToShippingStep}
          />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">{main}</div>
      )}
    </>
  );
}
