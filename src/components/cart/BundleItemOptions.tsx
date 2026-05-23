import type { BundleCartOption } from "@/src/framework/graphql/cart/types";

type Props = {
  readonly options: readonly BundleCartOption[];
  readonly size?: "sm" | "xs";
};

export default function BundleItemOptions({ options, size = "sm" }: Props) {
  if (options.length === 0) return null;

  const textClass = size === "xs" ? "text-xs" : "text-sm";
  const mt = size === "xs" ? "mt-0.5" : "mt-1";

  return (
    <dl className={`${mt} space-y-0.5`}>
      {options.map((opt) => (
        <div key={opt.uid} className={`flex gap-1 ${textClass} text-gray-600`}>
          <dt className="font-medium shrink-0">{opt.label}:</dt>
          <dd>
            {opt.values
              .map((v) => `${v.label}${v.quantity > 1 ? ` x${v.quantity}` : ""}`)
              .join(", ")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
