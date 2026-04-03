type PageLoaderProps = {
  /** Visible text under the spinner */
  label?: string;
  /** Minimum height when not full screen */
  minHeightClassName?: string;
  /** Fill the viewport (e.g. route `loading.tsx`) */
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-8 w-8 border-2",
  md: "h-10 w-10 border-2",
  lg: "h-12 w-12 border-[3px]",
} as const;

/**
 * Theme-aligned loader using `--color-theme-primary` (Tailwind `border-t-theme-primary`).
 */
export default function PageLoader({
  label = "Loading…",
  minHeightClassName = "min-h-[40vh]",
  fullScreen = false,
  size = "md",
}: PageLoaderProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-4 px-theme-container-padding ${
        fullScreen ? "min-h-screen" : minHeightClassName
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      <div
        className={`page-loader-spinner rounded-full border-solid border-f0f0f0 border-t-theme-primary animate-spin ${sizeClasses[size]}`}
        aria-hidden
      />
      {label ? (
        <p className="text-base leading-[1.3] text-foreground/60 lg-custom:text-lg!">
          {label}
        </p>
      ) : null}
    </div>
  );
}
