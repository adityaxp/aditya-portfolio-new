import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Analytics",
  robots: { index: false, follow: false },
};

export default function PortfolioAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
