"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQueryList.matches);

    updateMatches();

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", updateMatches);
    } else {
      mediaQueryList.addListener(updateMatches);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", updateMatches);
      } else {
        mediaQueryList.removeListener(updateMatches);
      }
    };
  }, [query]);

  return matches;
}
