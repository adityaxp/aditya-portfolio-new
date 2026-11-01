"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import AdminIcon from "@/components/admin/AdminIcon";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });

function getTheme(): Theme {
  const saved = window.localStorage.getItem("admin-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeTheme(update: () => void) {
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", update);
  window.addEventListener("admin-theme-change", update);
  preference.addEventListener("change", update);
  return () => {
    window.removeEventListener("storage", update);
    window.removeEventListener("admin-theme-change", update);
    preference.removeEventListener("change", update);
  };
}

export function AdminThemeProvider({ children, className }: { children: React.ReactNode; className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, (): Theme => "light");
  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    window.localStorage.setItem("admin-theme", next);
    window.dispatchEvent(new Event("admin-theme-change"));
  };
  return <ThemeContext.Provider value={{ theme, toggle }}><div className={`admin-ui ${className ?? ""}`} data-theme={theme}>{children}</div></ThemeContext.Provider>;
}

export function AdminThemeToggle() {
  const { theme, toggle } = useContext(ThemeContext);
  const label = `Switch to ${theme === "light" ? "dark" : "light"} theme`;
  return <button type="button" className="admin-theme-toggle" onClick={toggle} aria-label={label} title={label}><AdminIcon name={theme === "light" ? "moon" : "sun"} size={18} /></button>;
}
