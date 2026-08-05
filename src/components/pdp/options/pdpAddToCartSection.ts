/** Shared wrapper for PDP add-to-cart + compare + wishlist (matches simple `ProductActions` row). */
export const PDP_ADD_TO_CART_WRAP_CLASS =
  "py-5 lg-custom:py-7.5! border-t border-aaa border-b" as const;

/**
 * Main options / customization block on PDP — same shell as `ConfigurableOptions`
 * (top rule + vertical rhythm).
 */
export const PDP_OPTIONS_BLOCK_CLASS =
  "flex flex-col gap-5 border-t border-aaa py-5 lg-custom:py-7.5!" as const;

export const PDP_OPTION_LABEL_CLASS =
  "font-bold uppercase text-black flex items-center gap-1" as const;

export const PDP_OPTION_REQUIRED_CLASS = "text-light-red" as const;

const PDP_CHOICE_CHIP_BASE =
  "px-4 py-3 border lg-custom:py-2.5! leading-none min-w-[116px] xl-custom:min-w-[150px] transition-colors cursor-pointer";

/** Swatch / choice button — matches configurable attribute value buttons. */
export function pdpChoiceChipClass(selected: boolean): string {
  return selected
    ? `${PDP_CHOICE_CHIP_BASE} border-theme-primary bg-theme-primary text-white`
    : `${PDP_CHOICE_CHIP_BASE} border-black bg-white text-black hover:border-theme-primary`;
}

/** Native `<select>` on PDP — black keyline like configurable swatches. */
export const PDP_OPTION_SELECT_CLASS =
  "w-full max-w-xl border border-black bg-white px-4 py-3 text-sm text-black focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary" as const;
