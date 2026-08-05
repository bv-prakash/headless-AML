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
  label = "Loading...",
  minHeightClassName = "min-h-[40vh]",
  fullScreen = false,
  size = "md",
}: PageLoaderProps) {
  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-9999 flex items-center h-full justify-center bg-white/90 backdrop-blur-[1px]"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
        }}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
          }}
        >
          <div
            className="page-loader-spinner"
            style={{
              width: size === "sm" ? "2rem" : size === "lg" ? "3rem" : "2.5rem",
              height: size === "sm" ? "2rem" : size === "lg" ? "3rem" : "2.5rem",
              border: `${size === "lg" ? 3 : 2}px solid #f0f0f0`,
              borderTopColor: "var(--color-theme-primary, #2563eb)",
              borderRadius: "9999px",
              animation: "page-loader-spin 0.9s linear infinite",
            }}
            aria-hidden
          />
          <style>{`
            @keyframes page-loader-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          {label ? (
            <p
              className="text-base leading-[1.3] text-foreground/60 lg-custom:text-lg!"
              style={{ fontSize: "1rem", lineHeight: 1.3, color: "rgba(0,0,0,0.6)" }}
            >
              {label}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-4 px-theme-container-padding ${minHeightClassName}`}
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
