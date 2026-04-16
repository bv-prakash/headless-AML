"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

type CheckoutSelectProps = {
  readonly label: string;
  readonly registration: UseFormRegisterReturn;
  readonly options: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly required?: boolean;
  readonly className?: string;
  readonly error?: string;
  readonly placeholderOption?: string;
  readonly labelSrOnly?: boolean;
  readonly disabled?: boolean;
};

export default function CheckoutSelect({
  label,
  registration,
  options,
  required,
  className = "",
  error,
  placeholderOption = " ",
  labelSrOnly,
  disabled = false,
}: CheckoutSelectProps) {
  const fieldId = `checkout-select-${String(registration.name)}`;
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
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <select
        {...registration}
        disabled={disabled}
        id={fieldId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${fieldId}-err` : undefined}
        className={`select w-full h-10 px-3 text-base border rounded bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary ${
          error ? "border-red-500" : "border-gray-300"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}`}
      >
        <option value="">{placeholderOption}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${fieldId}-err`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
