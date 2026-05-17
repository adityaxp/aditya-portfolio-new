import type { Metadata } from "next";
import { Sofia_Sans } from "next/font/google";
import { siteConfig } from "@/lib/constants";
import "./globals.css";

const sofiaSans = Sofia_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sofiaSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-canvas-cream font-sans text-ink-black"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
