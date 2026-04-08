const AUTH_ERROR_PATTERNS = ["not authorized", "sign in", "current customer"];

const STALE_CART_PATTERNS = [
  "cannot perform operations on cart",
  "could not find a cart",
];

export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function isAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return AUTH_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function isStaleCartError(message: string): boolean {
  const lower = message.toLowerCase();
  return STALE_CART_PATTERNS.some((pattern) => lower.includes(pattern));
}
