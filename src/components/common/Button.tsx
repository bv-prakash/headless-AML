import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

const BASE_CLASSES =
  "inline-flex items-center justify-center font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-theme-primary disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANT_CLASSES = {
  primary:
    "bg-theme-primary text-white border border-theme-primary hover:bg-white hover:text-theme-primary cursor-pointer",
  secondary:
    "border border-aaa bg-white text-gray-700 hover:bg-theme-primary hover:text-white hover:border-theme-primary cursor-pointer",
  danger:
    "text-red-600 hover:text-red-800 underline cursor-pointer",
  ghost:
    "bg-transparent text-gray-700 hover:text-theme-primary cursor-pointer",
  link:
    "text-theme-primary underline hover:no-underline bg-transparent cursor-pointer",
} as const;

const SIZE_CLASSES = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 md:h-10 px-4 text-base gap-2",
  lg: "h-11 md:h-12 px-6 text-lg gap-2.5",
  icon: "w-9 h-9 md:w-10 md:h-10 p-0",
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASSES;
export type ButtonSize = keyof typeof SIZE_CLASSES;

type ButtonProps = {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
  readonly className?: string;
  readonly children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

const Spinner = () => (
  <span
    className="block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
    role="status"
  >
    <span className="sr-only">Loading</span>
  </span>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      loadingLabel,
      className = "",
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    const classes = [
      BASE_CLASSES,
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={classes}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? (
          <>
            <Spinner />
            {loadingLabel && <span>{loadingLabel}</span>}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
