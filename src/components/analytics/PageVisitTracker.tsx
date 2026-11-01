"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { clientAnalyticsPayload, trackPortfolioEvent } from "@/lib/clientAnalytics";
import { isLocalAnalyticsHost } from "@/lib/localAnalytics";

export default function PageVisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || isLocalAnalyticsHost(location.hostname) || pathname === "/admin" || pathname === "/hosted" || pathname === "/portfolio-analytics") return;
    const body = JSON.stringify(clientAnalyticsPayload());
    void fetch("/api/page-visits", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    let visibleSince: number | null = document.visibilityState === "visible" ? Date.now() : null;
    let scrolled = false;
    const onScroll = () => {
      if (!scrolled && document.documentElement.scrollHeight > innerHeight && scrollY / (document.documentElement.scrollHeight - innerHeight) >= .5) {
        scrolled = true;
        trackPortfolioEvent("scroll", "50%");
      }
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (link && link.origin !== location.origin) trackPortfolioEvent("outbound_click", link.hostname || link.protocol.replace(":", ""));
    };
    const onHide = () => {
      if (document.visibilityState === "hidden" && visibleSince !== null) {
        trackPortfolioEvent("engagement", undefined, Date.now() - visibleSince);
        visibleSince = null;
      } else if (document.visibilityState === "visible" && visibleSince === null) visibleSince = Date.now();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onHide);
      if (visibleSince !== null) trackPortfolioEvent("engagement", undefined, Date.now() - visibleSince);
    };
  }, [pathname]);
  return null;
}
