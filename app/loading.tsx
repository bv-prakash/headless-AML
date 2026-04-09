import PageLoader from "@/src/components/common/PageLoader";

/** Lightweight segment transition — avoids a full-screen “popup” feel on client navigations (e.g. sign-in → home). */
export default function RootLoading() {
  return (
    <PageLoader
      label="Loading…"
      minHeightClassName="min-h-[120px]"
      size="sm"
    />
  );
}
