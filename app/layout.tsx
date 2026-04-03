import type { Metadata } from "next";
import "./globals.css";
import { Footer, Header } from "@/src/components";
import ToastContainer from '@/src/components/common/ToastContainer';
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "Home | American Lighting",
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
      className={`font-proxima-nova h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
