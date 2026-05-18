"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const CODE_LENGTH = 6;

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
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusIndex = useCallback((index: number) => {
    inputRefs.current[index]?.focus();
  }, []);

  useEffect(() => {
    if (!locked) focusIndex(0);
  }, [locked, focusIndex]);

  const handleChange = (index: number, value: string) => {
    if (locked || isVerifying) return;

    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);

    if (digit && index < CODE_LENGTH - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusIndex(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (locked || isVerifying) return;

    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;

    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setDigits(next);
    focusIndex(Math.min(pasted.length, CODE_LENGTH - 1));
  };

  const handleVerify = async () => {
    if (locked || isVerifying) return;

    const code = digits.join("");
    if (code.length !== CODE_LENGTH) {
      setError(`Enter all ${CODE_LENGTH} digits.`);
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/analytics/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

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
        onLockout();
        alert("Maximum tries exhausted. You cannot try again for a while.");
        return;
      }

      const remaining =
        typeof data.attemptsRemaining === "number"
          ? data.attemptsRemaining
          : attemptsRemaining - 1;

      onAttemptsChange?.(remaining);

      setError(
        data.message ??
          `Invalid code. ${remaining} attempt(s) left.`,
      );
      setDigits(Array(CODE_LENGTH).fill(""));
      focusIndex(0);
    } catch {
      setError("Could not verify. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-lg rounded-2xl border border-ink-black/10 bg-lifted-cream p-8 shadow-[0_24px_60px_-32px_rgba(20,20,19,0.2)] md:p-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-center text-2xl font-medium tracking-[-0.02em] text-ink-black md:text-3xl">
        Restricted access
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-granite md:text-base">
        Enter your 6-digit code to open the analytics panel.
      </p>

      <motion.div
        className="mt-8 flex justify-center gap-2 md:gap-2.5"
        onPaste={handlePaste}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={locked || isVerifying}
            aria-label={`Digit ${index + 1}`}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="h-12 w-10 rounded-lg border border-ink-black/15 bg-canvas-cream text-center text-lg font-semibold text-ink-black outline-none transition-[border-color,box-shadow] focus:border-light-orange focus:ring-2 focus:ring-light-orange/25 disabled:cursor-not-allowed disabled:opacity-50 md:h-14 md:w-11"
          />
        ))}
      </motion.div>

      {locked ? (
        <p className="mt-6 text-center text-sm font-medium text-signal-orange">
          Maximum tries exhausted. Try again later.
        </p>
      ) : (
        <p className="mt-4 text-center text-xs text-slate-gray">
          {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} remaining
        </p>
      )}

      {error ? (
        <p className="mt-3 text-center text-sm font-medium text-signal-orange">
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        <Button
          variant="primary"
          size="large"
          className="w-full"
          disabled={locked || isVerifying}
          onClick={handleVerify}
        >
          {isVerifying ? "Verifying…" : "Verify"}
        </Button>
      </div>
    </motion.div>
  );
}