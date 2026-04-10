import type { Metadata } from "next";
import "./globals.css";
import { LazyHeader } from "@/src/components/common/LazyHeader";
import { LazyFooter } from "@/src/components/common/LazyFooter";
import ClientToastContainer from "@/src/components/common/ClientToastContainer";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: {
    template: "%s | American Lighting",
    default: "Home | American Lighting",
  },
  description: "American Lighting, Inc manufactures a wide range of lighting solutions for your residential, commercial and specialty lighting needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="font-proxima-nova h-full antialiased"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
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
