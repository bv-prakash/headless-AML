"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary:", error);
  }, [error]);

  return (
    <div className="container flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Something went wrong
      </h2>
      <p className="text-gray-500 mb-6 max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-theme-primary text-white font-semibold px-6 py-2.5 text-sm uppercase hover:opacity-90 transition-opacity cursor-pointer"
      >
        Try Again
      </button>
    </div>
  );
}
