"use client";

import { useEffect, useState } from "react";
import AccessGate from "@/components/analytics/AccessGate";

export default function ProtectedPage({
  children,
  destination,
}: {
  children: React.ReactNode;
  destination: string;
}) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(4);

  useEffect(() => {
    let active = true;
    fetch("/api/analytics/verify", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session check failed");
        return response.json() as Promise<{
          authenticated?: boolean;
          locked?: boolean;
          attemptsRemaining?: number;
        }>;
      })
      .then((data) => {
        if (!active) return;
        setAuthenticated(Boolean(data.authenticated));
        setLocked(Boolean(data.locked));
        setAttemptsRemaining(data.attemptsRemaining ?? 4);
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (authenticated === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-canvas-cream">
        <p className="text-sm text-granite">Loading...</p>
      </div>
    );
  }

  if (authenticated) return children;

  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas-cream px-4 py-10">
      <AccessGate
        destination={destination}
        locked={locked}
        attemptsRemaining={attemptsRemaining}
        onVerified={() => setAuthenticated(true)}
        onLockout={() => {
          setLocked(true);
          setAttemptsRemaining(0);
        }}
        onAttemptsChange={setAttemptsRemaining}
      />
    </div>
  );
}
