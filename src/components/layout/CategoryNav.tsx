
import { getCategoryTreeForNav } from "@/src/framework/graphql/category/queries/getCategoryList";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";
import CategoryNavigationMenu from "./CategoryNavClient";

const CategoryNavigation = async () => {
  const storeViewCode = await getServerStoreViewCode();
  const categories = await getCategoryTreeForNav(storeViewCode);
  const topLevel = categories[0]?.children ?? [];

  if (!topLevel.length) return null;

  return (
    <CategoryNavigationMenu items={topLevel} />
  );
};

export default CategoryNavigation;
