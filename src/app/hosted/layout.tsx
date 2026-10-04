import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hosted Files | Aditya Balsane",
  robots: { index: false, follow: false },
};

export default function HostedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
