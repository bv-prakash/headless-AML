import PageLoader from "@/src/components/common/PageLoader";

export default function CheckoutSuccessLoading() {
  return (
    <div className="container py-8 md:py-12">
      <PageLoader label="Loading…" minHeightClassName="min-h-[40vh]" />
    </div>
  );
}
