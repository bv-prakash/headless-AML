import { CombinedGraphQLErrors } from "@apollo/client/errors";

const AUTH_ERROR_PATTERNS = [
  "not authorized",
  "isn't authorized",
  "is not authorized",
  "current customer",
  "customer is not logged in",
];

/** Failed login / signup — must not trigger “session expired” handling */
const NOT_SESSION_AUTH_PATTERNS = [
  "incorrect",
  "account sign-in",
  "account is disabled",
  "captcha",
  "verify your",
];

const STALE_CART_PATTERNS = [
  "cannot perform operations on cart",
  "could not find a cart",
];

/** Magento GraphQL often returns these when `X-Customer-Token` is missing or invalid */
const SESSION_INVALID_TEXT_PATTERNS = [
  "the current customer isn't authorized",
  "the current customer is not authorized",
  "current customer isn't authorized",
  "customer is not logged in",
  "could not identify customer",
];

export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function isAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  if (NOT_SESSION_AUTH_PATTERNS.some((p) => lower.includes(p))) return false;
  return AUTH_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function isStaleCartError(message: string): boolean {
  const lower = message.toLowerCase();
  return STALE_CART_PATTERNS.some((pattern) => lower.includes(pattern));
}

type GraphQLErrorLike = {
  readonly message: string;
  readonly extensions?: Record<string, unknown> | null;
};

export function graphQLErrorHasAuthorizationCategory(
  errors: readonly GraphQLErrorLike[] | undefined,
): boolean {
  if (!errors?.length) return false;
  return errors.some((e) => e.extensions?.category === "graphql-authorization");
}

export function messagesIndicateInvalidCustomerSession(text: string): boolean {
  const lower = text.toLowerCase();
  if (NOT_SESSION_AUTH_PATTERNS.some((p) => lower.includes(p))) return false;
  if (lower.includes("graphql-authorization")) return true;
  return SESSION_INVALID_TEXT_PATTERNS.some((p) => lower.includes(p));
}

/**
 * True when Magento rejected the customer token (expired / revoked / invalid).
 * Use after failed mutations or in Apollo `ErrorLink` when a token was sent.
 */
export function isCustomerSessionInvalidError(err: unknown): boolean {
  if (CombinedGraphQLErrors.is(err)) {
    const combined = err.errors.map((e) => e.message).join(" ");
    if (isStaleCartError(combined)) return false;
    return messagesIndicateInvalidCustomerSession(combined);
  }
  if (err instanceof Error) {
    if (isStaleCartError(err.message)) return false;
    return messagesIndicateInvalidCustomerSession(err.message);
  }
  return false;
}
