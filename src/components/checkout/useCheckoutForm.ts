"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { clearCart } from "@/src/store/slices/cartSlice";
import { selectAuthHydrated, selectIsLoggedIn } from "@/src/store/selectors";
import { getErrorMessage } from "@/src/utils/errors";
import { checkoutSuccessHref } from "@/src/constants/checkoutRoutes";
import {
  CART_QUERY,
  type CartQueryResponse,
  type CartQueryVariables,
} from "@/src/framework/graphql/mutations/cartMutations";
import {
  CART_CHECKOUT_OPTIONS_QUERY,
  SET_BILLING_ADDRESS_ON_CART,
  SET_GUEST_EMAIL_ON_CART,
  SET_PAYMENT_METHOD_AND_PLACE_ORDER,
  SET_SHIPPING_ADDRESSES_ON_CART,
  SET_SHIPPING_METHODS_ON_CART,
  type CartCheckoutOptionsResponse,
  type CartAddressInput,
  type PaymentMethodQuote,
  type SetBillingAddressResponse,
  type SetBillingAddressVariables,
  type SetGuestEmailResponse,
  type SetGuestEmailVariables,
  type SetPaymentMethodAndPlaceOrderResponse,
  type SetPaymentMethodAndPlaceOrderVariables,
  type SetShippingAddressesResponse,
  type SetShippingAddressesVariables,
  type SetShippingMethodsResponse,
  type SetShippingMethodsVariables,
  type ShippingMethodOnAddress,
  type BillingAddressMutationInput,
} from "@/src/framework/graphql/mutations/checkoutMutations";
import {
  CUSTOMER_FOR_CHECKOUT_QUERY,
  type CustomerForCheckoutResponse,
} from "@/src/framework/graphql/queries/customerCheckout";
import {
  formatCustomerAddressSummary,
  formatShippingFormSummary,
  sameAddressId,
  toCartAddressInput,
} from "@/src/components/checkout/addressHelpers";
import {
  parseShippingMethodKey,
  shippingMethodKey,
  shippingMethodLabel,
} from "@/src/components/checkout/shippingMethodHelpers";
import { emptyAddress } from "@/src/components/checkout/addressTypes";

export function useCheckoutForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authHydrated = useAppSelector(selectAuthHydrated);
  const cartHydrated = useAppSelector((s) => s.cart.hydrated);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const cartId = useAppSelector((s) => s.cart.cartId);
  const checkoutStoreReady = authHydrated && cartHydrated;

  const [guestEmail, setGuestEmail] = useState("");
  const [shipping, setShipping] = useState(emptyAddress);
  const [sameBilling, setSameBilling] = useState(true);
  const [billing, setBilling] = useState(emptyAddress);
  const [billingSaveBook, setBillingSaveBook] = useState(true);
  const [useNewShippingForm, setUseNewShippingForm] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<
    number | null
  >(null);

  const [checkoutStep, setCheckoutStep] = useState<"shipping" | "payment">(
    "shipping",
  );
  const [shippingOptions, setShippingOptions] = useState<
    ShippingMethodOnAddress[]
  >([]);
  const [paymentOptions, setPaymentOptions] = useState<PaymentMethodQuote[]>(
    [],
  );
  const [selectedShipKey, setSelectedShipKey] = useState<string | null>(null);
  const [selectedPaymentCode, setSelectedPaymentCode] = useState<string | null>(
    null,
  );
  /** Bumps to remount `ShippingAddressFields` after external prefill (e.g. new address from account). */
  const [shippingHydrateVersion, setShippingHydrateVersion] = useState(0);

  const { data: cartData, loading: cartLoading, refetch: refetchCart } =
    useQuery<CartQueryResponse, CartQueryVariables>(CART_QUERY, {
      variables: { cartId: cartId ?? "" },
      skip: !cartId,
      fetchPolicy: "network-only",
    });

  const {
    data: customerData,
    loading: customerLoading,
    error: customerQueryError,
  } = useQuery<CustomerForCheckoutResponse, Record<string, never>>(
    CUSTOMER_FOR_CHECKOUT_QUERY,
    {
      skip: !checkoutStoreReady || !isLoggedIn,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    },
  );

  const savedAddresses = useMemo(
    () => customerData?.customer?.addresses ?? [],
    [customerData?.customer],
  );

  useEffect(() => {
    if (customerQueryError) {
      toast.error(
        getErrorMessage(
          customerQueryError,
          "Could not load your account addresses. You can still enter a shipping address below.",
        ),
      );
    }
  }, [customerQueryError]);

  useEffect(() => {
    if (!isLoggedIn || !customerData?.customer) return;
    const addrs = customerData.customer.addresses ?? [];
    if (addrs.length === 0) {
      setUseNewShippingForm(true);
      setSelectedSavedAddressId(null);
      return;
    }
    setUseNewShippingForm(false);
    setSelectedSavedAddressId((prev) => {
      if (prev != null && addrs.some((a) => sameAddressId(a.id, prev))) {
        return Number(prev);
      }
      const def =
        addrs.find((a) => a.default_shipping) ?? addrs[0];
      return def != null ? Number(def.id) : null;
    });
  }, [isLoggedIn, customerData]);

  const [setGuestEmailMutation] = useMutation<
    SetGuestEmailResponse,
    SetGuestEmailVariables
  >(SET_GUEST_EMAIL_ON_CART);

  const [setShippingAddresses] = useMutation<
    SetShippingAddressesResponse,
    SetShippingAddressesVariables
  >(SET_SHIPPING_ADDRESSES_ON_CART);

  const [setShippingMethods] = useMutation<
    SetShippingMethodsResponse,
    SetShippingMethodsVariables
  >(SET_SHIPPING_METHODS_ON_CART);

  const [setBillingAddress] = useMutation<
    SetBillingAddressResponse,
    SetBillingAddressVariables
  >(SET_BILLING_ADDRESS_ON_CART);

  const [setPaymentAndPlaceOrder] = useMutation<
    SetPaymentMethodAndPlaceOrderResponse,
    SetPaymentMethodAndPlaceOrderVariables
  >(SET_PAYMENT_METHOD_AND_PLACE_ORDER);

  const [fetchCheckoutOptions] = useLazyQuery<
    CartCheckoutOptionsResponse,
    { cartId: string }
  >(CART_CHECKOUT_OPTIONS_QUERY, { fetchPolicy: "network-only" });

  const [submitting, setSubmitting] = useState(false);
  /** True while address/billing is being applied and rates are fetched (auto-sync). */
  const [shippingRatesLoading, setShippingRatesLoading] = useState(false);
  const quoteRequestIdRef = useRef(0);

  const selectedShippingSummary = useMemo(() => {
    if (!selectedShipKey) return null;
    const m = shippingOptions.find(
      (x) => shippingMethodKey(x) === selectedShipKey,
    );
    return m ? shippingMethodLabel(m) : null;
  }, [selectedShipKey, shippingOptions]);

  const selectedShippingMethodTitle = useMemo(() => {
    if (!selectedShipKey) return null;
    const m = shippingOptions.find(
      (x) => shippingMethodKey(x) === selectedShipKey,
    );
    if (!m) return null;
    return (
      [m.carrier_title, m.method_title].filter(Boolean).join(" — ") ||
      `${m.carrier_code} / ${m.method_code}`
    );
  }, [selectedShipKey, shippingOptions]);

  const selectedShippingAmount = useMemo(() => {
    if (!selectedShipKey) return null;
    const m = shippingOptions.find(
      (x) => shippingMethodKey(x) === selectedShipKey,
    );
    return m?.amount ?? null;
  }, [selectedShipKey, shippingOptions]);

  const shippingAddressSummaryText = useMemo(() => {
    if (
      isLoggedIn &&
      !useNewShippingForm &&
      selectedSavedAddressId != null
    ) {
      const addr = savedAddresses.find((a) =>
        sameAddressId(a.id, selectedSavedAddressId),
      );
      return addr
        ? formatCustomerAddressSummary(addr)
        : formatShippingFormSummary(shipping);
    }
    return formatShippingFormSummary(shipping);
  }, [
    isLoggedIn,
    useNewShippingForm,
    selectedSavedAddressId,
    savedAddresses,
    shipping,
  ]);

  const goBackToShippingStep = useCallback(() => {
    setCheckoutStep("shipping");
  }, []);

  const emptyCartRedirect = useMemo(() => {
    const q = cartData?.cart?.total_quantity ?? 0;
    return q === 0;
  }, [cartData?.cart?.total_quantity]);

  useEffect(() => {
    if (!cartId || cartLoading) return;
    if (emptyCartRedirect) {
      router.replace("/cart");
    }
  }, [cartId, cartLoading, emptyCartRedirect, router]);

  const syncShippingAndRates = useCallback(
    async (opts: { readonly validationToast: boolean }) => {
      if (!cartId) {
        if (opts.validationToast) toast.error("No active cart.");
        return;
      }

      if (!isLoggedIn && !guestEmail.trim()) {
        setShippingOptions([]);
        setSelectedShipKey(null);
        if (opts.validationToast) {
          toast.error("Enter an email address to continue.");
        }
        return;
      }

      const useSavedShipping =
        isLoggedIn &&
        !useNewShippingForm &&
        selectedSavedAddressId != null;

      if (isLoggedIn && !useNewShippingForm && selectedSavedAddressId == null) {
        setShippingOptions([]);
        setSelectedShipKey(null);
        if (opts.validationToast) {
          toast.error("Select a shipping address.");
        }
        return;
      }

      const shipAddr = toCartAddressInput(shipping, false);
      const billAddr = sameBilling
        ? toCartAddressInput(shipping, false)
        : toCartAddressInput(billing, billingSaveBook);

      if (!useSavedShipping) {
        if (
          !shipAddr.firstname ||
          !shipAddr.lastname ||
          !shipAddr.street[0] ||
          !shipAddr.city ||
          !shipAddr.region ||
          !shipAddr.postcode ||
          !shipAddr.telephone
        ) {
          setShippingOptions([]);
          setSelectedShipKey(null);
          if (opts.validationToast) {
            toast.error("Please complete all required shipping fields.");
          }
          return;
        }
      }

      if (
        !sameBilling &&
        (!billAddr.firstname ||
          !billAddr.lastname ||
          !billAddr.street[0] ||
          !billAddr.city ||
          !billAddr.region ||
          !billAddr.postcode ||
          !billAddr.telephone)
      ) {
        setShippingOptions([]);
        setSelectedShipKey(null);
        if (opts.validationToast) {
          toast.error("Please complete all required billing fields.");
        }
        return;
      }

      const requestId = ++quoteRequestIdRef.current;
      setShippingRatesLoading(true);
      try {
        if (!isLoggedIn) {
          const { error: geErr } = await setGuestEmailMutation({
            variables: { cartId, email: guestEmail.trim() },
          });
          if (geErr) {
            if (requestId === quoteRequestIdRef.current) {
              setShippingOptions([]);
              setSelectedShipKey(null);
            }
            toast.error(geErr.message ?? "Could not set email.");
            return;
          }
        }

        const shippingAddresses: {
          address?: CartAddressInput;
          customer_address_id?: number;
        }[] = useSavedShipping
          ? [{ customer_address_id: selectedSavedAddressId! }]
          : [{ address: shipAddr }];

        const { error: shipError } = await setShippingAddresses({
          variables: {
            cartId,
            shippingAddresses,
          },
        });
        if (shipError) {
          if (requestId === quoteRequestIdRef.current) {
            setShippingOptions([]);
            setSelectedShipKey(null);
          }
          toast.error(shipError.message ?? "Shipping address failed.");
          return;
        }

        const billingPayload: BillingAddressMutationInput = sameBilling
          ? { same_as_shipping: true }
          : {
              address: {
                ...billAddr,
                save_in_address_book: billingSaveBook,
              },
            };

        const { error: billErr } = await setBillingAddress({
          variables: {
            cartId,
            billingAddress: billingPayload,
          },
        });
        if (billErr) {
          if (requestId === quoteRequestIdRef.current) {
            setShippingOptions([]);
            setSelectedShipKey(null);
          }
          toast.error(billErr.message ?? "Could not set billing address.");
          return;
        }

        const { data: optionsData, error: optionsError } =
          await fetchCheckoutOptions({ variables: { cartId } });
        if (optionsError) {
          if (requestId === quoteRequestIdRef.current) {
            setShippingOptions([]);
            setSelectedShipKey(null);
          }
          toast.error(
            getErrorMessage(
              optionsError,
              "Could not load shipping and payment options.",
            ),
          );
          return;
        }

        if (requestId !== quoteRequestIdRef.current) return;

        const shipMethods =
          optionsData?.cart?.shipping_addresses?.[0]?.available_shipping_methods?.filter(
            (m) => m.carrier_code && m.method_code,
          ) ?? [];
        const payMethods =
          optionsData?.cart?.available_payment_methods?.filter((p) => p.code) ??
          [];

        if (shipMethods.length === 0) {
          setShippingOptions([]);
          setSelectedShipKey(null);
          toast.error(
            "No active shipping methods for this address. Check cart items and store configuration.",
          );
          return;
        }
        if (payMethods.length === 0) {
          setShippingOptions([]);
          setSelectedShipKey(null);
          toast.error("No active payment methods available for this cart.");
          return;
        }

        setShippingOptions([...shipMethods]);
        setPaymentOptions([...payMethods]);
        setSelectedShipKey(shippingMethodKey(shipMethods[0]));
        setSelectedPaymentCode(
          payMethods.length === 1 ? payMethods[0].code : null,
        );
      } catch (err) {
        if (requestId === quoteRequestIdRef.current) {
          setShippingOptions([]);
          setSelectedShipKey(null);
        }
        toast.error(getErrorMessage(err, "Checkout failed."));
      } finally {
        if (requestId === quoteRequestIdRef.current) {
          setShippingRatesLoading(false);
        }
      }
    },
    [
      billing,
      billingSaveBook,
      cartId,
      fetchCheckoutOptions,
      guestEmail,
      isLoggedIn,
      sameBilling,
      selectedSavedAddressId,
      setBillingAddress,
      setGuestEmailMutation,
      setShippingAddresses,
      shipping,
      useNewShippingForm,
    ],
  );

  /** Debounced for typed addresses; immediate when a saved address is selected. */
  useEffect(() => {
    if (checkoutStep !== "shipping") return;
    if (!checkoutStoreReady || !cartId) return;
    if (isLoggedIn && customerLoading) return;

    const savedAddressMode =
      isLoggedIn && !useNewShippingForm && savedAddresses.length > 0;
    const delayMs = savedAddressMode ? 0 : 550;

    const timer = globalThis.setTimeout(() => {
      void syncShippingAndRates({ validationToast: false });
    }, delayMs);

    return () => globalThis.clearTimeout(timer);
  }, [
    checkoutStep,
    checkoutStoreReady,
    cartId,
    isLoggedIn,
    customerLoading,
    useNewShippingForm,
    savedAddresses.length,
    guestEmail,
    selectedSavedAddressId,
    shipping,
    sameBilling,
    billing,
    billingSaveBook,
    syncShippingAndRates,
  ]);

  const goToPaymentStep = useCallback(async () => {
    if (!cartId) {
      toast.error("No active cart.");
      return;
    }
    if (!selectedShipKey) {
      toast.error("Select a shipping method.");
      return;
    }

    const { carrier_code, method_code } = parseShippingMethodKey(selectedShipKey);
    if (!carrier_code || !method_code) {
      toast.error("Invalid shipping method.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: smErr } = await setShippingMethods({
        variables: {
          cartId,
          shippingMethods: [{ carrier_code, method_code }],
        },
      });
      if (smErr) {
        toast.error(smErr.message ?? "Could not set shipping method.");
        return;
      }

      await refetchCart({ cartId: cartId ?? "" });
      setCheckoutStep("payment");
      setSelectedPaymentCode((prev) =>
        prev ?? (paymentOptions.length === 1 ? paymentOptions[0].code : null),
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not continue to payment."));
    } finally {
      setSubmitting(false);
    }
  }, [
    cartId,
    paymentOptions,
    refetchCart,
    selectedShipKey,
    setShippingMethods,
  ]);

  const completeOrder = useCallback(async () => {
    if (!cartId) {
      toast.error("No active cart.");
      return;
    }
    if (checkoutStep !== "payment") {
      return;
    }
    if (!selectedPaymentCode) {
      toast.error("Select a payment method.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: placeData, error: placeErr } = await setPaymentAndPlaceOrder({
        variables: {
          cartId,
          paymentMethod: { code: selectedPaymentCode },
        },
      });
      if (placeErr) {
        toast.error(placeErr.message ?? "Could not place order.");
        return;
      }

      const orderId = placeData?.setPaymentMethodAndPlaceOrder?.order?.order_id;
      if (orderId == null || orderId === "") {
        toast.error("Order was not created. Please try again.");
        return;
      }

      dispatch(clearCart());
      toast.success("Order placed successfully.");
      router.push(checkoutSuccessHref(String(orderId)));
    } catch (err) {
      toast.error(getErrorMessage(err, "Checkout failed."));
    } finally {
      setSubmitting(false);
    }
  }, [
    cartId,
    checkoutStep,
    dispatch,
    router,
    selectedPaymentCode,
    setPaymentAndPlaceOrder,
  ]);

  const showSummarySidebar =
    checkoutStoreReady &&
    cartId &&
    !cartLoading &&
    !emptyCartRedirect &&
    cartData?.cart != null;

  const showNewShippingAddressModal =
    checkoutStoreReady &&
    checkoutStep === "shipping" &&
    isLoggedIn &&
    !customerLoading &&
    savedAddresses.length > 0 &&
    useNewShippingForm;

  const closeNewShippingAddressModal = useCallback(() => {
    setUseNewShippingForm(false);
  }, []);

  useEffect(() => {
    if (!showNewShippingAddressModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNewShippingAddressModal();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [showNewShippingAddressModal, closeNewShippingAddressModal]);

  const onSelectSavedAddress = useCallback((addressId: number) => {
    setSelectedSavedAddressId(addressId);
    setUseNewShippingForm(false);
  }, []);

  const onAddNewShippingAddress = useCallback(() => {
    const c = customerData?.customer;
    setUseNewShippingForm(true);
    setShipping({
      ...emptyAddress(),
      firstname: c?.firstname ?? "",
      lastname: c?.lastname ?? "",
      country_code: "US",
    });
    setShippingHydrateVersion((v) => v + 1);
  }, [customerData?.customer]);

  return {
    checkoutStoreReady,
    cartId,
    cartLoading,
    cartData,
    isLoggedIn,
    guestEmail,
    setGuestEmail,
    shipping,
    shippingHydrateVersion,
    setShipping,
    sameBilling,
    setSameBilling,
    billing,
    setBilling,
    billingSaveBook,
    setBillingSaveBook,
    useNewShippingForm,
    setUseNewShippingForm,
    selectedSavedAddressId,
    setSelectedSavedAddressId,
    checkoutStep,
    setCheckoutStep,
    shippingOptions,
    setSelectedShipKey,
    selectedShipKey,
    paymentOptions,
    selectedPaymentCode,
    setSelectedPaymentCode,
    customerLoading,
    customerData,
    savedAddresses,
    submitting,
    emptyCartRedirect,
    selectedShippingSummary,
    selectedShippingMethodTitle,
    selectedShippingAmount,
    shippingAddressSummaryText,
    shippingRatesLoading,
    goToPaymentStep,
    completeOrder,
    goBackToShippingStep,
    showSummarySidebar,
    showNewShippingAddressModal,
    closeNewShippingAddressModal,
    onSelectSavedAddress,
    onAddNewShippingAddress,
  };
}
