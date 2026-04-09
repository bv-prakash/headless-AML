"use client";

type CheckoutLoadingSpinnerProps = {
  readonly label?: string;
  readonly className?: string;
};

export default function CheckoutLoadingSpinner({
  label,
  className = "flex justify-center py-16",
}: CheckoutLoadingSpinnerProps) {
  return (
    <div
      className={className}
      aria-busy="true"
      aria-label={label ?? "Loading"}
    >
      <div
        className="h-10 w-10 rounded-full border-[3px] border-gray-200 border-t-theme-primary animate-spin"
        aria-hidden
      />
    </div>
  );
}
