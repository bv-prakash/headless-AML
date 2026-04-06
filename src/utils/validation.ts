export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_VALIDATION_MESSAGE = "Please enter a valid email address.";

export const emailValidation = {
  value: EMAIL_PATTERN,
  message: EMAIL_VALIDATION_MESSAGE,
} as const;
