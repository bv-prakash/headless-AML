import PageLoader from "@/src/components/common/loader/PageLoader";

export default function CheckoutLoading() {
  return (
    <div className="container py-8 md:py-12">
      <PageLoader label="Loading checkout…" minHeightClassName="min-h-[40vh]" />
    </div>
  );
}
