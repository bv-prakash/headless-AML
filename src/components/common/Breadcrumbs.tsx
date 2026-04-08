import Link from "next/link";
import { getCategoryBreadcrumbs } from "@/src/framework/graphql/queries/breadcrumbs";

type StaticItem = {
  readonly label: string;
  readonly href?: string;
};

type CategoryBreadcrumbsProps = {
  categoryId: string;
  productName?: string;
  items?: never;
};

type StaticBreadcrumbsProps = {
  categoryId?: never;
  productName?: never;
  items: readonly StaticItem[];
};

type BreadcrumbsProps = CategoryBreadcrumbsProps | StaticBreadcrumbsProps;

const Separator = () => (
  <span className="flex mr-2 text-black font-bold rotate-180" aria-hidden="true">
    <i className="icon-back-arrow text-lg leading-none before:font-bold" />
  </span>
);

export default async function Breadcrumbs(props: BreadcrumbsProps) {
  const trail: StaticItem[] = [];

  if ("items" in props && props.items) {
    trail.push(...props.items);
  } else if (props.categoryId) {
    const { name, breadcrumbs, urlPath } = await getCategoryBreadcrumbs(
      props.categoryId,
    );

    for (const crumb of breadcrumbs) {
      trail.push({
        label: crumb.category_name,
        href: `/products/${crumb.category_url_path ?? ""}`,
      });
    }

    if (name) {
      trail.push(
        props.productName
          ? { label: name, href: `/products/${urlPath}` }
          : { label: name },
      );
    }

    if (props.productName) {
      trail.push({ label: props.productName });
    }
  }

  return (
    <nav aria-label="breadcrumb" className="max-w-full p-0 m-0 mb-5">
      <ol className="breadcrumb flex items-center flex-wrap list-none p-0 m-0 text-base leading-[1.3] lg-custom:text-lg! text-theme-primary font-bold gap-2">
        <li className="breadcrumb-item flex items-center flex-nowrap">
          <Link href="/" className="decoration-none">Home</Link>
        </li>
        {trail.map((item, i) => (
          <li key={i} className="breadcrumb-item flex items-center flex-nowrap">
            <Separator />
            {item.href ? (
              <Link href={item.href} className="decoration-none">
                {item.label}
              </Link>
            ) : (
              <span className="text-black font-normal">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
