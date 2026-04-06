import Logo from "./Logo";
import CategoryNav from "./CategoryNav";
import SearchBar from "./SearchBar";
import ClientOnly from "./ClientOnly";
import HeaderAuth from "./HeaderAuth";
import CompareIcon from "@/src/components/compare/CompareIcon";
import WishlistIcon from "@/src/components/wishlist/WishlistIcon";
import CartIcon from "@/src/components/plp/CartIcon";
import Minicart from "@/src/components/plp/Minicart";

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
      <header className="relative bg-white border-b-2 md:border-b-4 border-solid border-theme-primary w-full z-10">
        <div className="container flex items-center md:py-[25px] md:px-[15px] xl:py-[35px]!">
          <Logo />

          <div className="flex flex-1 items-center justify-end gap-5">
            <CategoryNav />
            <SearchBar />
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
