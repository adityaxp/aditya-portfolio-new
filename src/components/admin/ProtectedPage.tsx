"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AccessGate from "@/components/admin/AccessGate";
import ReauthModal from "@/components/admin/ReauthModal";
import SessionWarning from "@/components/admin/SessionWarning";
import { AdminSessionProvider } from "@/components/admin/AdminSessionContext";
import { AdminThemeProvider } from "@/components/admin/AdminTheme";
import AdminLoading from "@/components/admin/AdminLoading";

type SessionInfo = {
  state?: "none" | "active" | "reauth" | "expired";
  reauthAt?: number;
  graceUntil?: number;
  serverNow?: number;
  locked?: boolean;
  attemptsRemaining?: number;
  reauthAttemptsRemaining?: number;
};

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(4);
  const [reauthAttemptsRemaining, setReauthAttemptsRemaining] = useState(2);
  const [reauthAt, setReauthAt] = useState<number | null>(null);
  const [graceUntil, setGraceUntil] = useState<number | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(0);
  const [renewing, setRenewing] = useState(false);
  const expiredRef = useRef(false);

  const expire = useCallback(() => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    setAuthenticated(false);
    setReauthAt(null);
    setGraceUntil(null);
    void fetch("/api/admin/logout", { method: "POST", credentials: "include" }).catch(() => {});
  }, []);

  const applySession = useCallback((data: SessionInfo) => {
    if (typeof data.serverNow === "number") setServerOffset(data.serverNow - Date.now());
    setNow(Date.now());
    if ((data.state === "active" || data.state === "reauth") && data.reauthAt && data.graceUntil) {
      expiredRef.current = false;
      setAuthenticated(true);
      setReauthAt(data.reauthAt);
      setGraceUntil(data.graceUntil);
    } else {
      setAuthenticated(false);
      setReauthAt(null);
      setGraceUntil(null);
    }
    setLocked(Boolean(data.locked));
    setAttemptsRemaining(data.attemptsRemaining ?? 4);
    setReauthAttemptsRemaining(data.reauthAttemptsRemaining ?? 2);
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const response = await fetch("/api/admin/verify", { credentials: "include", cache: "no-store" });
        if (!response.ok) throw new Error("Session check failed");
        const data = await response.json() as SessionInfo;
        if (active) applySession(data);
      } catch { if (active) setAuthenticated((current) => current === null ? false : current); }
    };
    void check();
    const onVisible = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("admin-session-required", check);
    return () => { active = false; document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("admin-session-required", check); };
  }, [applySession]);

  useEffect(() => {
    if (!authenticated || !graceUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [authenticated, graceUntil]);

  const serverNow = now + serverOffset;
  const needsReauth = authenticated && reauthAt !== null && serverNow >= reauthAt;
  const secondsToReauth = reauthAt === null ? 0 : Math.ceil((reauthAt - serverNow) / 1000);
  const showExpiryWarning = authenticated && secondsToReauth > 0 && secondsToReauth <= 30;
  useEffect(() => {
    if (authenticated && !renewing && graceUntil !== null && serverNow >= graceUntil) expire();
  }, [authenticated, renewing, graceUntil, serverNow, expire]);

  const renew = useCallback(async (code: string) => {
    setRenewing(true);
    try {
      const response = await fetch("/api/admin/reauth", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ totp: code }), signal: AbortSignal.timeout(5000),
      });
      const data = await response.json() as { success?: boolean; expired?: boolean; reauthAt?: number; serverNow?: number; attemptsRemaining?: number; message?: string };
      if (data.success && data.reauthAt) {
        setServerOffset(typeof data.serverNow === "number" ? data.serverNow - Date.now() : serverOffset);
        setNow(Date.now());
        setReauthAt(data.reauthAt);
        setGraceUntil(data.reauthAt + 20_000);
        setReauthAttemptsRemaining(2);
        return;
      }
      if (data.expired) { expire(); return; }
      if (typeof data.attemptsRemaining === "number") setReauthAttemptsRemaining(data.attemptsRemaining);
      throw new Error(data.message ?? "Could not verify. Try again before time runs out.");
    } finally {
      setRenewing(false);
    }
  }, [expire, serverOffset]);

  if (authenticated === null) {
    return <AdminLoading />;
  }

  if (authenticated) return (
    <AdminSessionProvider value={{ secondsRemaining: Math.max(0, secondsToReauth) }}>
      <AdminThemeProvider>
        <div inert={needsReauth ? true : undefined}>{children}</div>
        {showExpiryWarning ? <SessionWarning seconds={secondsToReauth} /> : null}
        {needsReauth && graceUntil !== null ? <ReauthModal secondsLeft={Math.max(0, Math.ceil((graceUntil - serverNow) / 1000))} attemptsRemaining={reauthAttemptsRemaining} onRenew={renew} onExpire={expire} /> : null}
      </AdminThemeProvider>
    </AdminSessionProvider>
  );

  return (
    <AdminThemeProvider className="admin-gate-bg">
      <AccessGate
        locked={locked}
        attemptsRemaining={attemptsRemaining}
        onVerified={() => {
          setAuthenticated(null);
          fetch("/api/admin/verify", { credentials: "include", cache: "no-store" })
            .then((response) => response.json())
            .then((data: SessionInfo) => applySession(data))
            .catch(() => setAuthenticated(false));
        }}
        onLockout={() => {
          setLocked(true);
          setAttemptsRemaining(0);
        }}
        onAttemptsChange={setAttemptsRemaining}
      />
    </AdminThemeProvider>
  );
}
