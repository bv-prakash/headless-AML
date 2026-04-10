import type { RegisterOptions } from "react-hook-form";
import type { AddressFormState } from "@/src/components/checkout/addressTypes";

type Rules = {
  readonly [K in keyof AddressFormState]?: RegisterOptions<AddressFormState, K>;
};

/** Validation for Magento-style shipping address fields (react-hook-form `register` rules). */
export const SHIPPING_ADDRESS_RULES: Rules = {
  firstname: {
    required: "First name is required",
    maxLength: { value: 50, message: "First name is too long" },
  },
  lastname: {
    required: "Last name is required",
    maxLength: { value: 50, message: "Last name is too long" },
  },
  company: {
    maxLength: { value: 100, message: "Company name is too long" },
  },
  street1: {
    required: "Street address is required",
    maxLength: { value: 255, message: "Street address is too long" },
  },
  street2: {
    maxLength: { value: 255, message: "Street line 2 is too long" },
  },
  city: {
    required: "City is required",
    maxLength: { value: 100, message: "City is too long" },
  },
  region: {
    required: "State / region is required",
    maxLength: { value: 100, message: "Region is too long" },
  },
  postcode: {
    required: "ZIP / postal code is required",
    validate: (v) => {
      const t = String(v).trim();
      if (t.length < 3) return "Enter a valid postal code";
      return true;
    },
  },
  country_code: {
    required: "Country is required",
    minLength: { value: 2, message: "Use a 2-letter country code" },
    maxLength: { value: 2, message: "Use a 2-letter country code" },
    pattern: {
      value: /^[A-Za-z]{2}$/,
      message: "Country must be a 2-letter code (e.g. US)",
    },
  },
  telephone: {
    required: "Phone number is required",
    validate: (v) => {
      const digits = String(v).replace(/\D/g, "");
      if (digits.length < 10) {
        return "Enter a valid phone number (at least 10 digits)";
      }
      return true;
    },
  },
};
