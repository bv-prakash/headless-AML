import config from "@/src/config/config";

const DEFAULT_STORE_CODE = "default";

export function getActiveStoreCode(): string {
  return config.commerce.storeCode?.trim() || DEFAULT_STORE_CODE;
}
