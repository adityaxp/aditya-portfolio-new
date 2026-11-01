"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import AdminIcon from "@/components/admin/AdminIcon";
import { AdminThemeToggle } from "@/components/admin/AdminTheme";

type AccessGateProps = {
  locked: boolean;
  attemptsRemaining: number;
  onVerified: () => void;
  onLockout: () => void;
  onAttemptsChange?: (remaining: number) => void;
};

export default function AccessGate({
  locked,
  attemptsRemaining,
  onVerified,
  onLockout,
  onAttemptsChange,
}: AccessGateProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [invalidCode, setInvalidCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const digitRefs = useRef<Array<HTMLInputElement | null>>([]);
  const verificationInFlight = useRef(false);
  const lastAutoSubmittedCode = useRef("");
  const totp = digits.join("");

  useEffect(() => {
    if (!locked) digitRefs.current[0]?.focus();
  }, [locked]);

  const enterDigits = (index: number, value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) {
      setDigits((current) => current.map((digit, position) => position === index ? "" : digit));
      setError(null);
      setInvalidCode(false);
      return;
    }

    const start = numbers.length === 6 ? 0 : index;
    setDigits((current) => {
      const next = [...current];
      for (let offset = 0; offset < numbers.length && start + offset < 6; offset++) {
        next[start + offset] = numbers[offset];
      }
      return next;
    });
    setError(null);
    setInvalidCode(false);
    digitRefs.current[Math.min(start + numbers.length, 5)]?.focus();
  };

  const handleVerify = useCallback(async (code: string) => {
    if (locked || verificationInFlight.current) return;
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    verificationInFlight.current = true;
    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ totp: code }),
      });
      if (!res.ok && res.status !== 401 && res.status !== 403) throw new Error("Verification unavailable");

      const data = (await res.json()) as {
        success?: boolean;
        locked?: boolean;
        message?: string;
        attemptsRemaining?: number;
      };

      if (data.success) {
        onVerified();
        return;
      }

      if (data.locked) {
        setInvalidCode(true);
        onLockout();
        return;
      }

      const remaining = typeof data.attemptsRemaining === "number"
        ? data.attemptsRemaining
        : attemptsRemaining - 1;
      onAttemptsChange?.(remaining);
      setError(data.message ?? `Invalid code. ${remaining} attempt(s) left.`);
      setInvalidCode(true);
      setDigits(Array(6).fill(""));
      requestAnimationFrame(() => digitRefs.current[0]?.focus());
    } catch {
      setError("Could not verify. Please try again.");
    } finally {
      verificationInFlight.current = false;
      setIsVerifying(false);
    }
  }, [locked, attemptsRemaining, onVerified, onLockout, onAttemptsChange]);

  useEffect(() => {
    if (totp.length !== 6) {
      lastAutoSubmittedCode.current = "";
      return;
    }
    if (lastAutoSubmittedCode.current === totp) return;
    lastAutoSubmittedCode.current = totp;
    void handleVerify(totp);
  }, [totp, handleVerify]);

  return (
    <motion.div
      className="admin-login"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="admin-login-visual" aria-hidden="true">
        <div className="admin-login-mark">aditya<span> / admin</span></div>
        <div className="admin-login-visual-title">Your private<br />space.</div>
        <div className="admin-login-visual-footer"><AdminIcon name="shield" size={17} /> SECURE ACCESS</div>
      </div>

      <div className="admin-login-form">
        <div className="admin-gate-theme"><AdminThemeToggle /></div>
        <h1>Enter your 2-FA code</h1>
        <form onSubmit={(event) => { event.preventDefault(); void handleVerify(totp); }}>
          <label htmlFor="authenticator-code">Authenticator code</label>
          <div className={`admin-code-slots${invalidCode ? " is-invalid" : ""}`} role="group" aria-label="Authenticator code">
            {digits.map((digit, index) => (
              <input
                key={index}
                id={index === 0 ? "authenticator-code" : undefined}
                ref={(node) => { digitRefs.current[index] = node; }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={6}
                value={digit}
                aria-label={`Digit ${index + 1} of 6`}
                aria-invalid={invalidCode}
                aria-describedby={error ? "admin-code-error" : undefined}
                disabled={locked || isVerifying}
                onChange={(event) => enterDigits(index, event.target.value)}
                onPaste={(event) => {
                  event.preventDefault();
                  enterDigits(index, event.clipboardData.getData("text"));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digits[index] && index > 0) {
                    event.preventDefault();
                    setDigits((current) => current.map((value, position) => position === index - 1 ? "" : value));
                    digitRefs.current[index - 1]?.focus();
                  } else if (event.key === "ArrowLeft" && index > 0) {
                    event.preventDefault();
                    digitRefs.current[index - 1]?.focus();
                  } else if (event.key === "ArrowRight" && index < 5) {
                    event.preventDefault();
                    digitRefs.current[index + 1]?.focus();
                  }
                }}
                className="admin-code-digit"
              />
            ))}
          </div>

          {locked ? (
            <p className="admin-login-lockout">Maximum tries exhausted. Try again later.</p>
          ) : (
            <p className="admin-attempts">
              {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} remaining
            </p>
          )}

          {error ? <p id="admin-code-error" className="admin-login-error" role="alert">{error}</p> : null}

          <button type="submit" className="admin-primary-button" disabled={locked || isVerifying}>
            {isVerifying ? "Verifying…" : "Continue"}
            {!isVerifying ? <span aria-hidden="true">→</span> : null}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
