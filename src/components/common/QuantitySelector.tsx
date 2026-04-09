"use client";

import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { getResolvedCartQuantity } from "@/src/store/cartQuantity";
import { setQuantity as setStoreQuantity } from "@/src/store/slices/cartSlice";

type QuantitySelectorProps = {
  readonly itemKey: string;
  readonly defaultValue?: number;
  readonly min?: number;
  readonly max?: number;
  readonly disabled?: boolean;
  readonly onChange?: (newValue: number) => void;
  readonly size?: "sm" | "md" | "lg";
  readonly className?: string;
};

const SIZE_CLASSES = {
  sm: {
    button: "w-6 h-6 text-xs",
    input: "w-8 h-6 text-xs",
  },
  md: {
    button: "w-8 h-8 text-sm",
    input: "w-10 h-8 text-sm",
  },
  lg: {
    button: "w-10 h-10 text-base",
    input: "w-14 h-10 text-base",
  },
} as const;

function normalizeFallback(
  n: number | undefined,
  min: number,
  max: number,
): number {
  if (n != null && Number.isFinite(n) && n >= min) {
    return Math.min(max, Math.floor(n));
  }
  return min;
}

export default function QuantitySelector({
  itemKey,
  defaultValue = 1,
  min = 1,
  max = 999,
  disabled = false,
  onChange,
  size = "sm",
  className = "",
}: QuantitySelectorProps) {
  const dispatch = useAppDispatch();
  /** Redux only — do not fold `defaultValue` into the selector or prop updates won’t refresh the display. */
  const resolved = useAppSelector((s) => getResolvedCartQuantity(s, itemKey));
  const fallback = useMemo(
    () => normalizeFallback(defaultValue, min, max),
    [defaultValue, min, max],
  );
  const qty =
    resolved != null && Number.isFinite(resolved) && resolved >= min
      ? Math.min(max, Math.floor(resolved))
      : fallback;
  const classes = SIZE_CLASSES[size];
  const canDecrement = qty > min && !disabled;
  const canIncrement = qty < max && !disabled;

  const updateQty = useCallback(
    (next: number) => {
      dispatch(setStoreQuantity({ key: itemKey, qty: next }));
      onChange?.(next);
    },
    [dispatch, itemKey, onChange],
  );

  const handleDecrement = useCallback(() => {
    if (canDecrement) updateQty(qty - 1);
  }, [canDecrement, qty, updateQty]);

  const handleIncrement = useCallback(() => {
    if (canIncrement) updateQty(qty + 1);
  }, [canIncrement, qty, updateQty]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = parseInt(e.target.value, 10);
      if (isNaN(raw)) return;
      updateQty(Math.min(max, Math.max(min, raw)));
    },
    [min, max, updateQty],
  );

  const btnBase =
    "flex items-center justify-center border border-f0f0f0 bg-f0f0f0 hover:bg-theme-primary hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed";

  return (
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={!canDecrement}
        className={`${classes.button} ${btnBase}`}
        aria-label="Decrease quantity"
      >
        <i className="icon-minus text-[2px] leading-none" aria-hidden="true" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        value={String(qty)}
        onChange={handleInputChange}
        disabled={disabled}
        className={`${classes.input} font-semibold text-center border-t border-b border-f0f0f0 bg-white disabled:opacity-40`}
        aria-label="Quantity"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={!canIncrement}
        className={`${classes.button} ${btnBase}`}
        aria-label="Increase quantity"
      >
        <i className="icon-plus text-xs leading-none" aria-hidden="true" />
      </button>
    </div>
  );
}
