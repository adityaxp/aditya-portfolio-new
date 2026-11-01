"use client";

import { isLocalAnalyticsHost } from "@/lib/localAnalytics";

const SESSION_KEY = "portfolio_analytics_session";

export function analyticsSessionId(): string {
  const now = Date.now();
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null") as { id?: string; last?: number } | null;
    const id = saved?.id && saved.last && now - saved.last < 30 * 60_000 ? saved.id : crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: now }));
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function clientAnalyticsPayload() {
  const agent = navigator.userAgent;
  const params = new URLSearchParams(location.search);
  return {
    browser: /Firefox/i.test(agent) ? "Firefox" : /Edg/i.test(agent) ? "Edge" : /Chrome/i.test(agent) ? "Chrome" : /Safari/i.test(agent) ? "Safari" : "Unknown",
    os: /Android/i.test(agent) ? "Android" : /iPhone|iPad/i.test(agent) ? "iOS" : /Windows/i.test(agent) ? "Windows" : /Mac/i.test(agent) ? "MacOS" : "Unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    utmSource: params.get("utm_source") || "direct",
    path: location.pathname,
    referrer: document.referrer ? new URL(document.referrer).hostname : "direct",
    sessionId: analyticsSessionId(),
  };
}

export function trackPortfolioEvent(type: "project_open" | "outbound_click" | "scroll" | "engagement", target?: string, durationMs?: number) {
  if (isLocalAnalyticsHost(location.hostname)) return;
  const body = JSON.stringify({ ...clientAnalyticsPayload(), type, target, durationMs });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/engagement", new Blob([body], { type: "application/json" }));
  else void fetch("/api/engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
}
