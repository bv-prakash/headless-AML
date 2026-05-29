import PageLoader from "@/src/components/common/loader/PageLoader";

export default function CartLoading() {
  return <PageLoader label="Loading cart…" minHeightClassName="min-h-[40vh]" />;
}
