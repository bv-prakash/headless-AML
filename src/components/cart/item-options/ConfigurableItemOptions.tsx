import type { ConfigurableCartOption } from "@/src/framework/graphql/cart/types";

type Props = {
  readonly options: readonly ConfigurableCartOption[];
  readonly size?: "sm" | "xs";
};

export default function ConfigurableItemOptions({ options, size = "sm" }: Props) {
  if (options.length === 0) return null;

  const textClass = size === "xs" ? "text-xs" : "text-sm";
  const mt = size === "xs" ? "mt-0.5" : "mt-1";

  return (
    <dl className={`${mt} space-y-0.5`}>
      {options.map((opt) => (
        <div key={opt.option_label} className={`flex gap-1 ${textClass} text-gray-600`}>
          <dt className="font-medium">{opt.option_label}:</dt>
          <dd>{opt.value_label}</dd>
        </div>
      ))}
    </dl>
  );
}
