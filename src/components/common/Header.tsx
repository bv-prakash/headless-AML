import dynamic from "next/dynamic";
import Logo from "./Logo";
import CategoryNav from "./CategoryNav";
import SearchBar from "./SearchBar";
import ClientOnly from "./ClientOnly";
import HeaderAuth from "./HeaderAuth";
import CompareIcon from "@/src/components/compare/CompareIcon";
import StoreViewToggle from "@/src/components/common/StoreViewToggle";
import LanguageSwitcher from "@/src/components/common/LanguageSwitcher";
import WishlistIcon from "@/src/components/wishlist/WishlistIcon";
import CartIcon from "@/src/components/plp/CartIcon";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";
import { isStoreComponentEnabled } from "@/src/theme/store-view";

const Minicart = dynamic(() => import("@/src/components/plp/Minicart"));

function HeaderIconsPlaceholder() {
  return (
    <div className="flex items-center gap-5">
      <span className="w-[22px] h-[22px]" />
      <span className="w-[22px] h-[22px]" />
      <span className="w-[22px] h-[22px]" />
      <span className="w-[26px] h-[26px]" />
    </div>
  );
}


export default async function Header() {
  const storeViewCode = await getServerStoreViewCode();
  return (
    <>
      <header className={`relative z-40 w-full bg-theme-header-bg text-theme-header-fg max-md:py-5 ${storeViewCode === "proluxelighting_store_view" || storeViewCode === "prizmlighting_store_view" ? "" : "border-b-2 border-solid border-theme-header-border md:border-b-4"}`}>
        <div className="container flex flex-wrap items-center gap-y-5 md:px-[15px] md:py-[25px] xl:py-[35px]!">
          <Logo />

          <div className="flex flex-1 flex-wrap items-center justify-end gap-5">
            {isStoreComponentEnabled("categoryNav", storeViewCode) ? <CategoryNav /> : null}
            <SearchBar className="max-md:order-1 max-md:w-full max-md:flex-1" />
            <ClientOnly fallback={<HeaderIconsPlaceholder />}>
              <LanguageSwitcher />
              {isStoreComponentEnabled("storeViewToggle", storeViewCode) ? <StoreViewToggle /> : null}
              {isStoreComponentEnabled("compareIcon", storeViewCode) ? <CompareIcon /> : null}
              {isStoreComponentEnabled("wishlistIcon", storeViewCode) ? <WishlistIcon /> : null}
              {isStoreComponentEnabled("cartIcon", storeViewCode) ? <CartIcon /> : null}
              {isStoreComponentEnabled("headerAuth", storeViewCode) ? <HeaderAuth /> : null}
            </ClientOnly>
          </div>
        </div>
      </header>
      <ClientOnly>
        <Minicart />
      </ClientOnly>
    </>
  );
}
