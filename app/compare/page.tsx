import type { Metadata } from "next";
import CompareList from "@/src/components/compare/CompareList";

export const metadata: Metadata = {
  title: "Compare Products | American Lighting",
  description: "Compare product features side by side.",
};

const ComparePage = () => {
  return (
    <div className="container py-8">
      <h1 className="text-xl font-bold mb-6 md:text-2xl lg-custom:text-[32px]!">
        Compare Products
      </h1>
      <CompareList />
    </div>
  );
};

export default ComparePage;
