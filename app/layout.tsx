import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Script from "next/script";
import "./globals.css";
import {
  STORE_VIEW_COOKIE_NAME,
  getHomeThemeId,
  getLanguageCodeForStoreView,
} from "@/src/config/storeViews";
import { LazyHeader } from "@/src/components/common/LazyHeader";
import { LazyFooter } from "@/src/components/common/LazyFooter";
import ClientToastContainer from "@/src/components/common/ClientToastContainer";
import Providers from "./Providers";
import { getServerStoreViewCode } from "@/src/framework/store/getActiveStoreCode";
import {
  resolveStoreViewTheme,
  storeViewThemeToHtmlStyle,
} from "@/src/theme/store-view";
import { STORE_VIEW_CODE_KEY } from "@/src/constants/storageKeys";

function getLanguageDir(languageCode: string): "ltr" | "rtl" {
  return languageCode === "ar" ? "rtl" : "ltr";
}

export const metadata: Metadata = {
  title: {
    template: "%s | American Lighting",
    default: "Home | American Lighting",
  },
  description: "American Lighting, Inc manufactures a wide range of lighting solutions for your residential, commercial and specialty lighting needs.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storeViewCode = await getServerStoreViewCode();
  const languageCode = getLanguageCodeForStoreView(storeViewCode);
  const languageDir = getLanguageDir(languageCode);
  const homeThemeId = getHomeThemeId(storeViewCode);
  const theme = resolveStoreViewTheme(storeViewCode);
  const htmlStyle = storeViewThemeToHtmlStyle(theme) as CSSProperties;
  const preHydrationScript = `
(() => {
  try {
    const root = document.documentElement;
    const storedStoreView = localStorage.getItem(${JSON.stringify(STORE_VIEW_CODE_KEY)});
    if (storedStoreView && storedStoreView.trim()) {
      root.dataset.storeView = storedStoreView.trim();
    } else {
      const cookieMatch = document.cookie.match(new RegExp('(?:^|; )' + ${JSON.stringify(STORE_VIEW_COOKIE_NAME)} + '=([^;]*)'));
      const cookieValue = cookieMatch?.[1] ? decodeURIComponent(cookieMatch[1]) : "";
      if (cookieValue) root.dataset.storeView = cookieValue;
    }
  } catch {}
})();
`;

  return (
    <html
      lang={languageCode}
      dir={languageDir}
      data-store-view={storeViewCode}
      data-home-theme={homeThemeId}
      className="h-full antialiased"
      style={htmlStyle}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-theme-body-bg"
      >
        <Script
          id="prehydrate-store-language-sync"
          strategy="beforeInteractive"
        >
          {preHydrationScript}
        </Script>
        <Providers>
          <LazyHeader />
          <main className="flex-1">{children}</main>
          <LazyFooter />
          <ClientToastContainer />
        </Providers>
      </body>
    </html>
  );
}
