"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useQuery } from "@apollo/client/react";
import { useForm, useWatch } from "react-hook-form";
import CheckoutField from "@/src/components/checkout/CheckoutField";
import CheckoutSelect from "@/src/components/checkout/CheckoutSelect";
import { resolveDirectoryRegionId } from "@/src/components/checkout/addressHelpers";
import { SHIPPING_ADDRESS_RULES } from "@/src/components/checkout/shippingAddressRules";
import type { AddressFormState } from "@/src/components/checkout/addressTypes";
import {
  COUNTRY_REGIONS_QUERY,
  type CountryRegionsResponse,
} from "@/src/framework/graphql/customer-addresses/queries/getCountryRegions";

export type ShippingAddressFieldsHandle = {
  readonly triggerValidation: () => Promise<boolean>;
};

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
] as const;

type ShippingAddressFieldsProps = {
  readonly shipping: AddressFormState;
  readonly setShipping: Dispatch<SetStateAction<AddressFormState>>;
  readonly showSaveInAddressBook?: boolean;
  readonly saveInAddressBook?: boolean;
  readonly onSaveInAddressBookChange?: (value: boolean) => void;
};

const ShippingAddressFields = forwardRef<
  ShippingAddressFieldsHandle,
  ShippingAddressFieldsProps
>(function ShippingAddressFields(
  {
    shipping,
    setShipping,
    showSaveInAddressBook,
    saveInAddressBook,
    onSaveInAddressBookChange,
  },
  ref,
) {
  const {
    register,
    control,
    formState: { errors },
    watch,
    trigger,
    setValue,
  } = useForm<AddressFormState>({
    defaultValues: shipping,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useImperativeHandle(
    ref,
    () => ({
      triggerValidation: () => trigger(),
    }),
    [trigger],
  );

  const countryCode = useWatch({ control, name: "country_code" }) ?? "US";
  const countryId = String(countryCode || "US").trim().toUpperCase();

  const { data: shippingCountryRegions, loading: regionsLoading } = useQuery<
    CountryRegionsResponse,
    { countryId: string }
  >(COUNTRY_REGIONS_QUERY, {
    variables: { countryId: countryId },
    skip: countryId.length !== 2,
    fetchPolicy: "cache-first",
  });

  const regionList = shippingCountryRegions?.country?.available_regions ?? [];
  const directoryRegionMode = regionsLoading || regionList.length > 0;

  const regionSelectOptions = useMemo(() => {
    const list = shippingCountryRegions?.country?.available_regions ?? [];
    if (!list.length) return [];
    return [...list]
      .map((r) => ({
        value: String(r.id),
        label: (r.name ?? r.code ?? String(r.id)).trim() || String(r.id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  }, [shippingCountryRegions]);

  const regionField = useWatch({ control, name: "region" });

  useEffect(() => {
    const list = shippingCountryRegions?.country?.available_regions ?? [];
    if (list.length === 0) return;
    const current = String(regionField ?? "").trim();
    if (!current) return;
    if (/^\d+$/.test(current)) return;
    const id = resolveDirectoryRegionId(current, list);
    if (id != null) {
      setValue("region", String(id), { shouldValidate: true, shouldDirty: false });
    }
  }, [shippingCountryRegions, regionField, setValue]);

  useEffect(() => {
    const sub = watch((value) => {
      setShipping(value as AddressFormState);
    });
    return () => sub.unsubscribe();
  }, [watch, setShipping]);

  const prevCountryRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevCountryRef.current === null) {
      prevCountryRef.current = countryId;
      return;
    }
    if (prevCountryRef.current === countryId) return;
    prevCountryRef.current = countryId;
    setValue("region", "");
  }, [countryId, setValue]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 sr-only" aria-hidden>
        * Required fields
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CheckoutField
          label="firstname"
          required
          labelSrOnly
          placeholder="First name*"
          registration={register("firstname", SHIPPING_ADDRESS_RULES.firstname)}
          error={errors.firstname?.message}
        />
        <CheckoutField
          label="lastname"
          required
          labelSrOnly
          placeholder="Last name*"
          registration={register("lastname", SHIPPING_ADDRESS_RULES.lastname)}
          error={errors.lastname?.message}
        />
      </div>

      <CheckoutField
        label="company"
        labelSrOnly
        placeholder="Company"
        className="w-full"
        registration={register("company", SHIPPING_ADDRESS_RULES.company)}
        error={errors.company?.message}
      />

      <fieldset className="border-0 p-0 m-0 min-w-0 mb-3">
        <legend className="font-semibold text-black mb-2 block">
          Street Address
        </legend>
        <div className="space-y-3">
          <CheckoutField
            label="street[0]"
            required
            labelSrOnly
            placeholder="Street Address: Line 1*"
            registration={register("street1", SHIPPING_ADDRESS_RULES.street1)}
            error={errors.street1?.message}
          />
          <CheckoutField
            label="street[1]"
            labelSrOnly
            placeholder="Apartment/Suite/Unit"
            registration={register("street2", SHIPPING_ADDRESS_RULES.street2)}
            error={errors.street2?.message}
          />
        </div>
      </fieldset>

      <CheckoutSelect
        label="country_id"
        required
        labelSrOnly
        placeholderOption=" "
        registration={register("country_code", {
          ...SHIPPING_ADDRESS_RULES.country_code,
          setValueAs: (v: unknown) =>
            String(v ?? "")
              .trim()
              .toUpperCase()
              .slice(0, 2),
        })}
        options={[...COUNTRY_OPTIONS]}
        error={errors.country_code?.message}
      />

      {directoryRegionMode ? (
        <CheckoutSelect
          label="region_id"
          required
          labelSrOnly
          disabled={regionsLoading}
          placeholderOption={
            regionsLoading
              ? "Loading regions…"
              : "Please select a region, state or province."
          }
          registration={register("region", {
            ...SHIPPING_ADDRESS_RULES.region,
            setValueAs: (v: unknown) => String(v ?? "").trim(),
          })}
          options={regionSelectOptions}
          error={errors.region?.message}
        />
      ) : (
        <CheckoutField
          label="region"
          required
          labelSrOnly
          placeholder="State/Province*"
          registration={register("region", SHIPPING_ADDRESS_RULES.region)}
          error={errors.region?.message}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CheckoutField
          label="city"
          required
          labelSrOnly
          placeholder="City*"
          registration={register("city", SHIPPING_ADDRESS_RULES.city)}
          error={errors.city?.message}
        />
        <CheckoutField
          label="postcode"
          required
          labelSrOnly
          placeholder="Zip/Postal Code*"
          registration={register("postcode", SHIPPING_ADDRESS_RULES.postcode)}
          error={errors.postcode?.message}
        />
      </div>

      <CheckoutField
        label="telephone"
        labelSrOnly
        placeholder="Phone number"
        registration={register("telephone", SHIPPING_ADDRESS_RULES.telephone)}
        error={errors.telephone?.message}
      />

      {showSaveInAddressBook && onSaveInAddressBookChange != null ? (
        <div className="field choice pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-theme-primary"
              checked={saveInAddressBook ?? true}
              onChange={(e) => onSaveInAddressBookChange(e.target.checked)}
            />
            <span>Save in address book</span>
          </label>
        </div>
      ) : null}
    </div>
  );
});

export default ShippingAddressFields;
