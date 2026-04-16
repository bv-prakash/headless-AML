import { getCategoryList } from "@/src/framework/graphql/queries/categoryList";
import CategoryNavClient from "./CategoryNavClient";
import Link from "next/link";

const CategoryNav = async () => {
  const categories = await getCategoryList("2");
  const topLevel = categories[0]?.children ?? [];

  if (!topLevel.length) return null;

  return (
    <nav aria-label="Product categories" className="bg-white">
      <div className="container flex items-center gap-x-7.5">
        <CategoryNavClient items={topLevel} />
        <Link href="/contact-us" className="text-sm font-bold text-black leading-[1.3] hover:text-theme-primary focus-visible:text-theme-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-theme-primary focus:outline-none transition-colors whitespace-nowrap">Contact Us</Link>
      </div>
    </nav>
  );
};

export default CategoryNav;
