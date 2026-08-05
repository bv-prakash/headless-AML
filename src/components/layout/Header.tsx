import dynamic from "next/dynamic";
import Logo from "./Logo";
import CategoryNavigation from "./CategoryNav";
import SearchBar from "./SearchBar";
import ClientOnly from "@/src/components/common/ClientOnly";
import HeaderNavToggle from "./HeaderNavToggle";
import HeaderAuth from "./HeaderAuth";
import CompareIcon from "@/src/components/compare/CompareIcon";
import StoreLanguageToggleGroup from "@/src/components/store-view/StoreLanguageToggleGroup";
import WishlistIcon from "@/src/components/wishlist/WishlistIcon";
import CartIcon from "@/src/components/cart/CartIcon";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";
import { isStoreComponentEnabled } from "@/src/theme/store-view";
import { ShowOnDesktop, ShowOnMobile } from "../common/Responsive";
const globalImage ="/globe.svg";

const Minicart = dynamic(() => import("@/src/components/cart/minicart/Minicart"));

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
      <header className={`relative z-40 w-full bg-theme-header-bg text-theme-header-fg ${storeViewCode === "proluxelighting_store_view" || storeViewCode === "prizmlighting_store_view" ? "" : "border-b-2 border-solid border-theme-header-border md:border-b-4"}`}>
        <div className="container flex items-center gap-y-5 pt-5 pb-12.5 md:px-[15px] md:py-[25px] xl:py-[35px]! relative">
          <Logo storeViewCode={storeViewCode} />
          <div className="flex items-center justify-end gap-5 rtl:md:mr-2.5 ltr:md:ml-2.5">
            {isStoreComponentEnabled("categoryNav", storeViewCode) ? <CategoryNavigation /> : null}
            <SearchBar/>
            <ClientOnly fallback={<HeaderIconsPlaceholder />}>
              <ShowOnDesktop breakpoint={768}>
                <StoreLanguageToggleGroup imageSrc={globalImage} />
                {isStoreComponentEnabled("compareIcon", storeViewCode) ? <CompareIcon /> : null}
                {isStoreComponentEnabled("wishlistIcon", storeViewCode) ? <WishlistIcon /> : null}
              </ShowOnDesktop>
              {isStoreComponentEnabled("cartIcon", storeViewCode) ? <CartIcon /> : null}
              {isStoreComponentEnabled("headerAuth", storeViewCode) ? <HeaderAuth /> : null}
            </ClientOnly>

             <ShowOnMobile>
              <ClientOnly>
                <HeaderNavToggle />
              </ClientOnly>
            </ShowOnMobile>
          </div>
        </div>
      </header>
      <ClientOnly>
        <Minicart />
      </ClientOnly>
    </>
  );
}
