"use client";

import { useEffect, useRef, useState } from "react";

export default function ReauthModal({ secondsLeft, attemptsRemaining, onRenew, onExpire }: {
  secondsLeft: number;
  attemptsRemaining: number;
  onRenew: (code: string) => Promise<void>;
  onExpire: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const submitted = useRef(false);
  const code = digits.join("");

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    inputs.current[0]?.focus();
    return () => { if (element.open) element.close(); };
  }, []);

  useEffect(() => {
    if (code.length !== 6 || submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    void onRenew(code).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Could not verify. Try again before time runs out.");
      setSubmitting(false);
      submitted.current = false;
      setDigits(Array(6).fill(""));
      requestAnimationFrame(() => inputs.current[0]?.focus());
    });
  }, [code, onRenew]);

  const writeDigits = (index: number, value: string) => {
    const numbers = value.replace(/\D/g, "");
    setError(null);
    if (!numbers) {
      setDigits((current) => current.map((digit, i) => i === index ? "" : digit));
      return;
    }
    const start = numbers.length === 6 ? 0 : index;
    setDigits((current) => {
      const next = [...current];
      for (let i = 0; i < numbers.length && start + i < 6; i++) next[start + i] = numbers[i];
      return next;
    });
    inputs.current[Math.min(start + numbers.length, 5)]?.focus();
  };

  return (
    <dialog ref={dialog} className="admin-reauth-backdrop" onCancel={(event) => event.preventDefault()} onKeyDown={(event) => {
      if (event.key === "Escape") event.preventDefault();
      if (event.key === "Tab") {
        const first = inputs.current[0];
        const last = inputs.current[5];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <div className="admin-reauth-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-reauth-title" aria-describedby="admin-reauth-desc">
        <div className="admin-reauth-top"><span className="admin-reauth-lock" aria-hidden="true">✳</span><span className="admin-reauth-timer">{secondsLeft}s</span></div>
        <h2 id="admin-reauth-title">Session timed out</h2>
        <p id="admin-reauth-desc">Enter a fresh 2-FA code to keep working. Your panel stays open while you verify.</p>
        <div className={`admin-code-slots admin-reauth-slots${error ? " is-invalid" : ""}`} role="group" aria-label="Authenticator code">
          {digits.map((digit, index) => (
            <input key={index} ref={(node) => { inputs.current[index] = node; }}
              type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${index + 1} of 6`} aria-invalid={Boolean(error)}
              maxLength={6} value={digit} disabled={submitting}
              onChange={(event) => writeDigits(index, event.target.value)}
              onPaste={(event) => { event.preventDefault(); writeDigits(index, event.clipboardData.getData("text")); }}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !digits[index] && index > 0) {
                  event.preventDefault();
                  setDigits((current) => current.map((value, i) => i === index - 1 ? "" : value));
                  inputs.current[index - 1]?.focus();
                } else if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
                else if (event.key === "ArrowRight" && index < 5) inputs.current[index + 1]?.focus();
              }} className="admin-code-digit" />
          ))}
        </div>
        {error ? <p className="admin-reauth-error" role="alert">{error}</p> : null}
        <p className="admin-reauth-footnote">{attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} remaining. The session ends after the second wrong code or when time runs out.</p>
        <button className="admin-reauth-expire" type="button" onClick={onExpire}>Sign out now</button>
      </div>
    </dialog>
  );
}
