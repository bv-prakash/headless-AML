const IS_BROWSER = typeof window !== "undefined";

export function getStoredValue(key: string): string | null {
  return IS_BROWSER ? localStorage.getItem(key) : null;
}

export function setStoredValue(key: string, value: string): void {
  if (IS_BROWSER) localStorage.setItem(key, value);
}

export function removeStoredValue(key: string): void {
  if (IS_BROWSER) localStorage.removeItem(key);
}
