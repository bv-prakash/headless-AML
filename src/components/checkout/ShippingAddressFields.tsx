"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useForm } from "react-hook-form";
import CheckoutField from "@/src/components/checkout/CheckoutField";
import { SHIPPING_ADDRESS_RULES } from "@/src/components/checkout/shippingAddressRules";
import type { AddressFormState } from "@/src/components/checkout/addressTypes";

export type ShippingAddressFieldsHandle = {
  readonly triggerValidation: () => Promise<boolean>;
};

type ShippingAddressFieldsProps = {
  readonly shipping: AddressFormState;
  readonly setShipping: Dispatch<SetStateAction<AddressFormState>>;
};

const ShippingAddressFields = forwardRef<
  ShippingAddressFieldsHandle,
  ShippingAddressFieldsProps
>(function ShippingAddressFields({ shipping, setShipping }, ref) {
  const {
    register,
    formState: { errors },
    watch,
    trigger,
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

  useEffect(() => {
    const sub = watch((value) => {
      setShipping(value as AddressFormState);
    });
    return () => sub.unsubscribe();
  }, [watch, setShipping]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <CheckoutField
        label="First name"
        required
        registration={register("firstname", SHIPPING_ADDRESS_RULES.firstname)}
        error={errors.firstname?.message}
      />
      <CheckoutField
        label="Last name"
        required
        registration={register("lastname", SHIPPING_ADDRESS_RULES.lastname)}
        error={errors.lastname?.message}
      />
      <CheckoutField
        label="Company"
        className="sm:col-span-2"
        registration={register("company", SHIPPING_ADDRESS_RULES.company)}
        error={errors.company?.message}
      />
      <CheckoutField
        label="Street"
        className="sm:col-span-2"
        required
        registration={register("street1", SHIPPING_ADDRESS_RULES.street1)}
        error={errors.street1?.message}
      />
      <CheckoutField
        label="Street line 2"
        className="sm:col-span-2"
        registration={register("street2", SHIPPING_ADDRESS_RULES.street2)}
        error={errors.street2?.message}
      />
      <CheckoutField
        label="City"
        required
        registration={register("city", SHIPPING_ADDRESS_RULES.city)}
        error={errors.city?.message}
      />
      <CheckoutField
        label="Region / State"
        required
        registration={register("region", SHIPPING_ADDRESS_RULES.region)}
        error={errors.region?.message}
      />
      <CheckoutField
        label="Region ID (optional)"
        registration={register("regionId", SHIPPING_ADDRESS_RULES.regionId)}
        error={errors.regionId?.message}
        placeholder="e.g. 12"
      />
      <CheckoutField
        label="ZIP / Postal code"
        required
        registration={register("postcode", SHIPPING_ADDRESS_RULES.postcode)}
        error={errors.postcode?.message}
      />
      <CheckoutField
        label="Country"
        required
        registration={register("country_code", {
          ...SHIPPING_ADDRESS_RULES.country_code,
          setValueAs: (v: unknown) =>
            String(v ?? "")
              .trim()
              .toUpperCase()
              .slice(0, 2),
        })}
        error={errors.country_code?.message}
      />
      <CheckoutField
        label="Phone"
        required
        registration={register("telephone", SHIPPING_ADDRESS_RULES.telephone)}
        error={errors.telephone?.message}
      />
    </div>
  );
});

export default ShippingAddressFields;
