"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import ShippingAddressFields, {
  type ShippingAddressFieldsHandle,
} from "@/src/components/checkout/address/ShippingAddressFields";
import {
  customerAddressToFormState,
  resolveDirectoryRegionId,
  sameAddressId,
  toCreateCustomerAddressInput,
} from "@/src/components/checkout/address/addressHelpers";
import { emptyAddress, type AddressFormState } from "@/src/components/checkout/address/addressTypes";
import {
  CREATE_CUSTOMER_ADDRESS_MUTATION,
  type CreateCustomerAddressResponse,
  type CreateCustomerAddressVariables,
} from "@/src/framework/graphql/customer-addresses/mutations/createCustomerAddress";
import {
  UPDATE_CUSTOMER_ADDRESS_MUTATION,
  type UpdateCustomerAddressResponse,
  type UpdateCustomerAddressVariables,
} from "@/src/framework/graphql/customer-addresses/mutations/updateCustomerAddress";
import { CUSTOMER_INFO_QUERY } from "@/src/framework/graphql/customer/queries/getCustomerInfo";
import type { CustomerForCheckoutResponse } from "@/src/framework/graphql/customer/types";
import {
  COUNTRY_REGIONS_QUERY,
  type CountryRegionsResponse,
} from "@/src/framework/graphql/customer-addresses/queries/getCountryRegions";
import { getErrorMessage } from "@/src/utils/errors";

const BTN_PRIMARY =
  "block w-auto py-2 px-5 text-sm text-center cursor-pointer bg-theme-primary text-white font-bold uppercase hover:opacity-90 transition-opacity disabled:bg-theme-primary/70 disabled:cursor-not-allowed";

export type AddressBookFormProps = {
  readonly mode: "create" | "edit";
  /** Required when `mode` is `"edit"`. */
  readonly addressId?: number;
};

export function AddressBookForm({ mode, addressId }: AddressBookFormProps) {
  const router = useRouter();
  const fieldsRef = useRef<ShippingAddressFieldsHandle>(null);

  const { data, loading: queryLoading } = useQuery<CustomerForCheckoutResponse>(
    CUSTOMER_INFO_QUERY,
    { skip: mode === "create", fetchPolicy: "network-only" },
  );

  const customer = data?.customer;
  const addresses = customer?.addresses;

  const existing = useMemo(() => {
    if (mode !== "edit" || addressId == null) return undefined;
    return addresses?.find((a) => sameAddressId(a.id, addressId));
  }, [mode, addressId, addresses]);

  const [shipping, setShipping] = useState<AddressFormState>(() => emptyAddress());
  const [defaultShipping, setDefaultShipping] = useState(false);
  const [defaultBilling, setDefaultBilling] = useState(false);
  /** Bumped when Apollo row is applied so `ShippingAddressFields` remounts — RHF `defaultValues` only run on mount. */
  const [fieldsVersion, setFieldsVersion] = useState(0);

  const formKey =
    mode === "edit" && addressId != null ? `edit-${addressId}` : "create";
  const shippingFieldsKey = `${formKey}-v${fieldsVersion}`;

  /** Stable identity for when to re-apply Apollo data (avoid re-running on new `existing` object references). */
  const hydrationKey =
    mode === "create"
      ? "create"
      : addressId == null
        ? "edit-missing-id"
        : existing != null && sameAddressId(existing.id, addressId)
          ? `edit-${addressId}`
          : `edit-pending-${addressId}`;

  const shippingCountryId = (shipping.country_code || "US").trim().toUpperCase();
  const { data: shippingCountryRegions, loading: regionsLoading } = useQuery<
    CountryRegionsResponse,
    { countryId: string }
  >(COUNTRY_REGIONS_QUERY, {
    variables: { countryId: shippingCountryId },
    skip: shippingCountryId.length !== 2,
    fetchPolicy: "cache-first",
  });

  const directoryRegionId = useMemo(() => {
    const list = shippingCountryRegions?.country?.available_regions ?? [];
    return resolveDirectoryRegionId(shipping.region, list);
  }, [shipping.region, shippingCountryRegions]);

  const resolvedRegionId = useMemo(() => {
    const list = shippingCountryRegions?.country?.available_regions ?? [];
    if (list.length > 0) {
      return directoryRegionId;
    }
    if (
      mode === "edit" &&
      existing?.region?.region_id != null &&
      (existing.country_code ?? "").trim().toUpperCase() === shippingCountryId
    ) {
      const rid = Number(existing.region.region_id);
      return Number.isFinite(rid) ? rid : null;
    }
    return null;
  }, [
    shippingCountryRegions,
    directoryRegionId,
    mode,
    existing,
    shippingCountryId,
  ]);

  const [createAddress, { loading: createLoading }] = useMutation<
    CreateCustomerAddressResponse,
    CreateCustomerAddressVariables
  >(CREATE_CUSTOMER_ADDRESS_MUTATION, {
    refetchQueries: [{ query: CUSTOMER_INFO_QUERY }],
    awaitRefetchQueries: true,
  });

  const [updateAddress, { loading: updateLoading }] = useMutation<
    UpdateCustomerAddressResponse,
    UpdateCustomerAddressVariables
  >(UPDATE_CUSTOMER_ADDRESS_MUTATION, {
    refetchQueries: [{ query: CUSTOMER_INFO_QUERY }],
    awaitRefetchQueries: true,
  });

  const syncDefaultsFromExisting = useCallback(() => {
    if (mode === "edit" && existing) {
      setShipping(customerAddressToFormState(existing));
      setDefaultShipping(!!existing.default_shipping);
      setDefaultBilling(!!existing.default_billing);
      setFieldsVersion((v) => v + 1);
    }
  }, [mode, existing]);

  /**
   * Sync form when route/mode or loaded row identity changes — not on every Apollo cache refresh.
   * `existing` is intentionally omitted from deps: it is read for the commit where `hydrationKey`
   * advanced (e.g. pending → row loaded); including `existing` would re-apply on new object references.
   */
  useLayoutEffect(() => {
    if (mode === "create") {
      setShipping(emptyAddress());
      setDefaultShipping(false);
      setDefaultBilling(false);
      setFieldsVersion((v) => v + 1);
      return;
    }
    if (existing != null) {
      setShipping(customerAddressToFormState(existing));
      setDefaultShipping(!!existing.default_shipping);
      setDefaultBilling(!!existing.default_billing);
      setFieldsVersion((v) => v + 1);
    }
  }, [mode, hydrationKey]);

  const showLoader =
    queryLoading ||
    (mode === "edit" &&
      addressId != null &&
      !existing &&
      addresses != null);

  const invalidEdit =
    mode === "edit" &&
    addressId != null &&
    !queryLoading &&
    addresses != null &&
    !existing;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = await fieldsRef.current?.triggerValidation();
    if (!valid) return;

    const regionList = shippingCountryRegions?.country?.available_regions ?? [];
    const requiresDirectoryRegion = regionList.length > 0;
    if (requiresDirectoryRegion && regionsLoading) {
      toast.error("Please wait for region options to load, then try again.");
      return;
    }
    if (requiresDirectoryRegion && directoryRegionId == null) {
      toast.error(
        "A region_id is required for the specified country code. Enter a valid state or province for this country (use the official code or full name).",
      );
      return;
    }

    const flags = {
      default_shipping: defaultShipping,
      default_billing: defaultBilling,
    };
    const input = toCreateCustomerAddressInput(
      shipping,
      flags,
      resolvedRegionId,
    );

    try {
      if (mode === "create") {
        const { error } = await createAddress({ variables: { input } });
        if (error) {
          toast.error(getErrorMessage(error, "Could not add this address."));
          return;
        }
        toast.success("Address saved.");
        router.push("/account/addresses");
        return;
      }

      if (addressId == null) {
        toast.error("Missing address id.");
        return;
      }

      const { error } = await updateAddress({
        variables: { id: addressId, input },
      });
      if (error) {
        toast.error(getErrorMessage(error, "Could not update this address."));
        return;
      }
      toast.success("Address updated.");
      router.push("/account/addresses");
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          mode === "create" ? "Could not add this address." : "Could not update this address.",
        ),
      );
    }
  };

  const title = mode === "create" ? "Add New Address" : "Edit Address";
  const saving = createLoading || updateLoading;

  if (invalidEdit) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl leading-[1.1] mb-5 mt-0 font-semibold md:text-[26px] lg-custom:text-[32px]! uppercase border-b border-aaa pt-2.5 md:pt-0 pb-[15px]">
          {title}
        </h1>
        <p className="text-gray-700">We could not find that address in your account.</p>
        <Link href="/account/addresses" className="text-theme-primary underline text-sm">
          Back to Address Book
        </Link>
      </div>
    );
  }

  if (showLoader || (mode === "edit" && existing == null)) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl leading-[1.1] mb-5 mt-0 font-semibold md:text-[26px] lg-custom:text-[32px]! uppercase border-b border-aaa pt-2.5 md:pt-0 pb-[15px]">
          {title}
        </h1>
        <p className="text-gray-600 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl leading-[1.1] mb-5 mt-0 font-semibold md:text-[26px] lg-custom:text-[32px]! uppercase border-b border-aaa pt-2.5 md:pt-0 pb-[15px]">
        {title}
      </h1>

      <form onSubmit={(e) => void onSubmit(e)} className="max-w-2xl space-y-6">
        <ShippingAddressFields
          key={shippingFieldsKey}
          ref={fieldsRef}
          shipping={shipping}
          setShipping={setShipping}
        />

        {mode === "edit" && existing ? (
          <button
            type="button"
            className="text-sm text-theme-primary underline"
            onClick={syncDefaultsFromExisting}
          >
            Reset form to saved address
          </button>
        ) : null}

        <fieldset className="border-0 p-0 m-0 space-y-3 mb-3">
          <legend className="font-semibold text-black mb-1">Use as default</legend>
          <label className="flex items-center gap-2 cursor-pointer text-gray-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-theme-primary"
              checked={defaultShipping}
              onChange={(e) => setDefaultShipping(e.target.checked)}
            />
            <span>Default shipping address</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-gray-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-theme-primary"
              checked={defaultBilling}
              onChange={(e) => setDefaultBilling(e.target.checked)}
            />
            <span>Default billing address</span>
          </label>
        </fieldset>

        <div className="flex flex-wrap gap-4 items-center">
          <button type="submit" disabled={saving} className={BTN_PRIMARY}>
            {saving ? "Saving…" : mode === "create" ? "Save Address" : "Update Address"}
          </button>
          <Link
            href="/account/addresses"
            className="text-sm text-gray-800 underline hover:text-theme-primary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
