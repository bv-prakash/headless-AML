"use client";

import { useId } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type CheckoutFieldControlledProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly required?: boolean;
  readonly className?: string;
  readonly placeholder?: string;
  readonly error?: string;
  readonly registration?: never;
};

type CheckoutFieldRhfProps = {
  readonly label: string;
  readonly registration: UseFormRegisterReturn;
  readonly required?: boolean;
  readonly className?: string;
  readonly placeholder?: string;
  readonly error?: string;
  /** Match Luma `common-label-hide` — placeholder carries the visible hint. */
  readonly labelSrOnly?: boolean;
  readonly value?: never;
  readonly onChange?: never;
};

export type CheckoutFieldProps = CheckoutFieldControlledProps | CheckoutFieldRhfProps;

export default function CheckoutField(props: CheckoutFieldProps) {
  const fallbackId = useId();

  if ("registration" in props && props.registration) {
    const {
      label,
      required,
      registration,
      className = "",
      placeholder,
      error,
      labelSrOnly,
    } = props;
    const fieldId = `checkout-field-${String(registration.name)}`;
    return (
      <div className={className}>
        <label
          htmlFor={fieldId}
          className={
            labelSrOnly
              ? "sr-only"
              : "block text-sm font-semibold text-black mb-1"
          }
        >
          {label}
          {required ? <span className="text-light-red"> *</span> : null}
        </label>
        <input
          {...registration}
          id={fieldId}
          placeholder={placeholder}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${fieldId}-err` : undefined}
          className={`input-text w-full h-10 md:h-12.5 px-3 md:px-4 border  bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary ${
            error ? "border-light-red" : "border-aaa"
          }`}
        />
        {error ? (
          <p id={`${fieldId}-err`} className="mt-1 text-sm text-light-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const {
    label,
    value,
    onChange,
    required,
    className = "",
    placeholder,
    error,
  } = props;
  const id = fallbackId;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-black mb-1">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`input-text w-full h-10 md:h-12.5 px-3 md:px-4 border  bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary ${
          error ? "border-light-red" : "border-aaa"
        }`}
      />
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-sm text-light-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
