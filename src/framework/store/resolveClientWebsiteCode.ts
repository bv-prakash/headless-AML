import { getWebsiteCodeForStoreView } from "@/src/config/storeViews";
import { resolveClientStoreViewCode } from "@/src/framework/store/resolveClientStoreViewCode";

/**
 * Browser-only — resolves the active Magento **website** code from the current store view.
 * Used to scope cart / compare / wishlist storage so switching to a store view on a different
 * website does not reuse a cart that Magento will reject
 * (`Can't assign cart to store in different website`).
 */
export function resolveClientWebsiteCode(): string {
  return getWebsiteCodeForStoreView(resolveClientStoreViewCode());
}
