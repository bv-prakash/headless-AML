"use client";

import { forwardRef, type ReactNode } from "react";

/** Shared input/select styling — keep both modals visually consistent. */
const FIELD_CLASS =
  "w-full border border-ccc px-3 py-2 leading-tight focus:outline-none focus:border-theme-primary";

function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  readonly htmlFor: string;
  readonly required?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-bold mb-1">
      {children}
      {required ? <span className="text-light-red"> *</span> : null}
    </label>
  );
}

type BaseFieldProps = {
  readonly id: string;
  readonly label: ReactNode;
  readonly required?: boolean;
};

type TextFieldProps = BaseFieldProps & {
  readonly type?: "text" | "email" | "tel";
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly maxLength?: number;
  readonly autoComplete?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      id,
      label,
      required,
      type = "text",
      value,
      onChange,
      maxLength,
      autoComplete,
    },
    ref,
  ) {
    return (
      <div>
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={FIELD_CLASS}
        />
      </div>
    );
  },
);

type TextAreaFieldProps = BaseFieldProps & {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly rows?: number;
  readonly maxLength?: number;
};

export function TextAreaField({
  id,
  label,
  required,
  value,
  onChange,
  rows = 3,
  maxLength,
}: TextAreaFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        required={required}
        className={`${FIELD_CLASS} resize-none`}
      />
    </div>
  );
}

type SelectOption = { readonly value: string; readonly label: string };

type SelectFieldProps = BaseFieldProps & {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: ReadonlyArray<SelectOption>;
  readonly placeholder?: string;
};

export function SelectField({
  id,
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
}: SelectFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={FIELD_CLASS}
      >
        {placeholder != null ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
