import Link from "next/link";
import { getCategoryBreadcrumbs } from "@/src/framework/graphql/queries/breadcrumbs";

type BreadcrumsProps = {
  categoryId: string;
};

const Breadcrums = async ({ categoryId }: BreadcrumsProps) => {
  const { name, breadcrumbs } = await getCategoryBreadcrumbs(categoryId);

  return (
    <nav aria-label="breadcrumb" className="max-w-full p-0 m-0">
      <ol className="breadcrumb flex items-center flex-wrap list-none p-0 m-0 text-base leading-[1.3] lg-custom:text-lg! text-theme-primary font-bold gap-2">
        <li className="breadcrumb-item flex items-center flex-nowrap">
          <Link href="/" className="decoration-none">Home</Link>
        </li>
        {breadcrumbs.map((crumb) => (
          <li key={crumb.category_id} className="breadcrumb-item flex items-center flex-nowrap">
            <span className="flex mr-2 text-black font-bold rotate-180" aria-hidden>
              <i className="icon-back-arrow text-lg leading-none before:font-bold"></i>
            </span>
            <Link
              href={`/products/${crumb.category_url_path ?? ""}`}
              className="decoration-none"
            >
              {crumb.category_name}
            </Link>
          </li>
        ))}
        {name && (
          <li className="breadcrumb-item flex items-center flex-nowrap">
            <span className="flex mr-2 text-black font-bold rotate-180" aria-hidden>
              <i className="icon-back-arrow text-lg leading-none before:font-bold"></i>
            </span>
            <span className="text-black font-normal">{name}</span>
          </li>
        )}
      </ol>
    </nav>
  );
};

export default Breadcrums;
