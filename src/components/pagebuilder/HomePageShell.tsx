"use client";

import dynamic from "next/dynamic";
import { useAppSelector } from "@/src/store/hooks";
import { selectAuthSessionRevision, selectStoreViewRevision } from "@/src/store/selectors";
import ApplyBackgroundImages from "@/src/components/pagebuilder/ApplyBackgroundImages";
import ApplyPageBuilderVideos from "@/src/components/pagebuilder/ApplyPageBuilderVideos";

const PageBuilderSliders = dynamic(
  () => import("@/src/components/pagebuilder/PageBuilderSliders"),
);
const FeatureCategoriesSlider = dynamic(
  () => import("@/src/components/pagebuilder/FeatureCategoriesSlider"),
);

type HomePageShellProps = {
  /** Server-resolved store view — bumps RSC subtree when cookie changes after refresh. */
  readonly storeViewKey: string;
};

/**
 * Client-only PageBuilder helpers (backgrounds + Swiper). CMS markup is rendered in
 * `app/page.tsx` as a Server Component sibling (`#html-body`) to avoid hydration
 * mismatches on `dangerouslySetInnerHTML`.
 *
 * Slider remounts on login/logout (`sessionRevision`) — avoids a broken Swiper after
 * client navigations (e.g. logout → home).
 */
export default function HomePageShell({ storeViewKey }: HomePageShellProps) {
  const sessionRevision = useAppSelector(selectAuthSessionRevision);
  const storeViewRevision = useAppSelector(selectStoreViewRevision);

  return (
    <>
      <ApplyBackgroundImages key={`bg-img-${storeViewKey}-${sessionRevision}`} />
      <PageBuilderSliders
        key={`pb-slider-${sessionRevision}-sv${storeViewRevision}-${storeViewKey}`}
        autoplay
        pagination
        loop
        autoplayDelayMs={7000}
      />
      <FeatureCategoriesSlider
        containerSelector=".home-feature-categories"
        listSelector=".feature-categories-ul"
        itemSelector=".feature-categories-column"
        minItemsToEnable={2}
      />
      <ApplyPageBuilderVideos key={`pb-video-${storeViewKey}-${sessionRevision}`} />
    </>
  );
}
