import Logo from "./Logo";
import CategoryNav from "./CategoryNav";

const Header = () => {
  return (
    <header className="relative bg-white border-b-2 md:border-b-4 border-solid border-theme-primary w-full z-10">
      <div className="container flex items-center md:py-[25px] md:px-[15px] xl:py-[35px]!">
        <Logo />
        <CategoryNav />
      </div>
    </header>
  );
};

export default Header;
