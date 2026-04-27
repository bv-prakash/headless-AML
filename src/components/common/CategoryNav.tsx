import { getCategoryTreeForNav } from "@/src/framework/graphql/queries/categoryList";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";
import CategoryNavClient from "./CategoryNavClient";
import Link from "next/link";

const CategoryNav = async () => {
  const storeViewCode = await getServerStoreViewCode();
  const categories = await getCategoryTreeForNav(storeViewCode);
  const topLevel = categories[0]?.children ?? [];

  if (!topLevel.length) return null;

  return (
    <nav aria-label="Product categories" className="bg-theme-header-bg">
      <div className="container flex items-center gap-x-7.5">
        <CategoryNavClient items={topLevel} />
        <Link
          href="/contact-us"
          className="whitespace-nowrap text-sm font-bold leading-[1.3] text-theme-header-fg transition-colors hover:text-theme-primary focus:outline-none focus-visible:text-theme-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-theme-primary"
        >
          Contact Us
        </Link>
      </div>
    </nav>
  );
};

export default CategoryNav;
