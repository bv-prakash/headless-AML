import dynamic from "next/dynamic";
import Logo from "./Logo";
import CategoryNav from "./CategoryNav";
import SearchBar from "./SearchBar";
import ClientOnly from "./ClientOnly";
import HeaderAuth from "./HeaderAuth";
import CompareIcon from "@/src/components/compare/CompareIcon";
import WishlistIcon from "@/src/components/wishlist/WishlistIcon";
import CartIcon from "@/src/components/plp/CartIcon";

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

const Header = () => {
  return (
    <>
      <header className="relative max-md:py-5 bg-white border-b-2 md:border-b-4 border-solid border-theme-primary w-full z-40">
        <div className="container flex items-center gap-y-5 flex-wrap md:py-[25px] md:px-[15px] xl:py-[35px]!">
          <Logo />

          <div className="flex flex-1 items-center justify-end gap-5 flex-wrap">
            <CategoryNav />
            <SearchBar className="max-md:w-full max-md:flex-1 max-md:order-1" />
            <ClientOnly fallback={<HeaderIconsPlaceholder />}>
              <CompareIcon />
              <WishlistIcon />
              <CartIcon />
              <HeaderAuth />
            </ClientOnly>
          </div>
        </div>
      </header>
      <ClientOnly>
        <Minicart />
      </ClientOnly>
    </>
  );
};

export default Header;
