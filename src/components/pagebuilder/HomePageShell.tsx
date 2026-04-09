"use client";

import dynamic from "next/dynamic";
import { useAppSelector } from "@/src/store/hooks";
import { selectAuthSessionRevision } from "@/src/store/selectors";
import ApplyBackgroundImages from "@/src/components/pagebuilder/ApplyBackgroundImages";

const PageBuilderSliders = dynamic(
  () => import("@/src/components/pagebuilder/PageBuilderSliders"),
);

type HomePageShellProps = {
  readonly rawContent: string;
};

/**
 * Wraps home PageBuilder markup + Swiper so the slider remounts on login/logout
 * (`sessionRevision`) — avoids a broken Swiper after client navigations (e.g. logout → home).
 */
export default function HomePageShell({ rawContent }: HomePageShellProps) {
  const sessionRevision = useAppSelector(selectAuthSessionRevision);

  return (
    <div>
      <div
        id="html-body"
        dangerouslySetInnerHTML={{ __html: rawContent }}
      />
      <ApplyBackgroundImages />
      <PageBuilderSliders
        key={`pb-slider-${sessionRevision}`}
        autoplay
        pagination
        loop
        autoplayDelayMs={7000}
      />
    </div>
  );
}
