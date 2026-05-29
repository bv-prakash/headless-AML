"use client";

import { useState, useMemo } from "react";
import { decodeHtmlEntities } from "@/src/utils/decodeHtmlEntities";
import { hasVisibleContent } from "@/src/utils/html";
import { sanitizeMagentoCmsHtml } from "@/src/utils/pagebuilder/sanitizeMagentoCmsHtml";

type Tab = {
  readonly id: string;
  readonly label: string;
  readonly content: string;
};

type ProductDescriptionProps = {
  readonly descriptionHtml?: string | null;
  readonly additionalTabs?: readonly Tab[];
};

export default function ProductDescription({
  descriptionHtml,
  additionalTabs = [],
}: ProductDescriptionProps) {
  const tabs: Tab[] = [];

  if (descriptionHtml && hasVisibleContent(descriptionHtml)) {
    tabs.push({
      id: "description",
      label: "Description",
      content: descriptionHtml,
    });
  }

  for (const tab of additionalTabs) {
    tabs.push(tab);
  }

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");

  if (tabs.length === 0) return null;

  const activeContent = useMemo(() => {
    const rawContent = tabs.find((t) => t.id === activeTab)?.content ?? "";
    return sanitizeMagentoCmsHtml(decodeHtmlEntities(rawContent));
  }, [tabs, activeTab]);

  return (
    <div className="product-description-tabs">
      {/* Tab buttons */}
      <div className="flex border-b border-gray-200" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold uppercase tracking-wide transition-colors cursor-pointer md:text-base ${
              activeTab === tab.id
                ? "border-b-2 border-theme-primary text-theme-primary"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        className="py-6 text-base leading-relaxed text-gray-700 max-w-none lg-custom:text-lg! product-description-content"
        dangerouslySetInnerHTML={{ __html: activeContent }}
      />
    </div>
  );
}
