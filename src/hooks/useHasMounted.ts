import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True in the browser after hydration; false during SSR and on the first client snapshot.
 * Implemented with `useSyncExternalStore` so server HTML and the initial hydration pass match
 * (recommended pattern vs `useEffect` + `setState` for client-only gating).
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
