/**
 * Returns a safe same-origin path for post-login redirects.
 * Blocks open redirects (`//`, `https:`, etc.).
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (raw == null || typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (trimmed === "" || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  if (trimmed.includes("://")) return fallback;
  return trimmed;
}
