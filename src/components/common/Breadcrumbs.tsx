// src/components/common/BreadcrumbsUI.tsx
import Link from "next/link";

export type BreadcrumbItem = { label: string; href?: string };

const Separator = () => (
  <span className="flex mr-2 text-black font-bold rotate-180" aria-hidden="true">
    <i className="icon-back-arrow text-lg leading-none before:font-bold" />
  </span>
);


export  function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-full p-0 m-0 mb-5">
      <ol className="breadcrumb flex items-center flex-wrap list-none p-0 m-0 text-base leading-[1.3] lg-custom:text-lg! text-theme-primary font-bold gap-2">
        <li className="breadcrumb-item flex items-center flex-nowrap"><Link href="/" className="decoration-none">Home</Link></li>
        {items.map((item, i) => (
          <li key={i} className="breadcrumb-item flex items-center flex-nowrap">
            <Separator />
            {item.href ? (
              <Link href={item.href} className="decoration-none">{item.label}</Link>
            ) : (
              <span className="text-black font-normal">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}