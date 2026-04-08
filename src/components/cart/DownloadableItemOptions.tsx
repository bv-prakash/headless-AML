import type { DownloadableCartLink } from "@/src/framework/graphql/mutations/cartMutations";

type Props = {
  readonly links: readonly DownloadableCartLink[];
  readonly size?: "sm" | "xs";
};

export default function DownloadableItemOptions({ links, size = "sm" }: Props) {
  if (links.length === 0) return null;

  const textClass = size === "xs" ? "text-xs" : "text-sm";
  const mt = size === "xs" ? "mt-0.5" : "mt-1";

  return (
    <div className={`${mt} ${textClass} text-gray-600`}>
      <span className="font-medium">Links: </span>
      {links.map((l) => l.title).join(", ")}
    </div>
  );
}
