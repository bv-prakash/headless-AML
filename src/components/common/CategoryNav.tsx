import { getCategoryList } from "@/src/framework/graphql/queries/categoryList";
import CategoryNavClient from "./CategoryNavClient";

const CategoryNav = async () => {
  const categories = await getCategoryList("2");
  const topLevel = categories[0]?.children ?? [];

  if (!topLevel.length) return null;

  return (
    <nav aria-label="Product categories" className="bg-white">
      <div className="container">
        <CategoryNavClient items={topLevel} />
      </div>
    </nav>
  );
};

export default CategoryNav;
