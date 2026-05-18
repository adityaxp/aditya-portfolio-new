"use client";

import { useCallback, useEffect, useState } from "react";
import AccessGate from "@/components/analytics/AccessGate";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export default function PortfolioAnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [locked, setLocked] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(4);

  const checkSession = useCallback(async () => {
    try {
      const statusRes = await fetch("/api/analytics/verify", {
        credentials: "include",
      });
      const status = (await statusRes.json()) as {
        locked?: boolean;
        attemptsRemaining?: number;
      };

      setLocked(Boolean(status.locked));
      setAttemptsRemaining(status.attemptsRemaining ?? 4);

      if (status.locked) {
        setIsAuthenticated(false);
        return;
      }

      const dataRes = await fetch("/api/analytics/page-visits", {
        credentials: "include",
      });

      if (dataRes.ok) {
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLockout = useCallback(() => {
    setLocked(true);
    setIsAuthenticated(false);
    setAttemptsRemaining(0);
  }, []);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-canvas-cream px-6">
        <p className="text-sm text-granite">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh w-full bg-canvas-cream">
      {isAuthenticated ? (
        <AnalyticsDashboard />
      ) : (
        <div className="flex min-h-svh w-full items-center justify-center px-4 py-10">
          <AccessGate
            locked={locked}
            attemptsRemaining={attemptsRemaining}
            onVerified={() => setIsAuthenticated(true)}
            onLockout={handleLockout}
            onAttemptsChange={setAttemptsRemaining}
          />
        </div>
      )}
    </div>
  );
}
