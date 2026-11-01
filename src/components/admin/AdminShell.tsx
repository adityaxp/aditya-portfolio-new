"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import AdminIcon from "@/components/admin/AdminIcon";
import { AdminThemeToggle } from "@/components/admin/AdminTheme";
import { useAdminSession } from "@/components/admin/AdminSessionContext";

type Section = "analytics" | "hosted";

const sections: { id: Section; href: string; label: string; icon: "chart" | "folder" }[] = [
  { id: "hosted", href: "/admin?tab=hosted", label: "Hosted files", icon: "folder" },
  { id: "analytics", href: "/admin?tab=analytics", label: "Analytics", icon: "chart" },
];

function subscribeSidebar(update: () => void) {
  window.addEventListener("storage", update);
  window.addEventListener("admin-sidebar-change", update);
  return () => {
    window.removeEventListener("storage", update);
    window.removeEventListener("admin-sidebar-change", update);
  };
}

export default function AdminShell({ active, children }: { active: Section; children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribeSidebar, () => localStorage.getItem("admin-sidebar-collapsed") === "true", () => false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const { secondsRemaining } = useAdminSession();
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const countdown = `${hours > 0 ? `${hours}:` : ""}${hours > 0 ? String(minutes).padStart(2, "0") : minutes}:${String(secondsRemaining % 60).padStart(2, "0")}`;
  const countdownTone = secondsRemaining > 30 ? "is-safe" : secondsRemaining > 10 ? "is-warning" : "is-urgent";

  const toggle = () => {
    localStorage.setItem("admin-sidebar-collapsed", String(!collapsed));
    window.dispatchEvent(new Event("admin-sidebar-change"));
  };

  const signOut = async () => {
    setSigningOut(true);
    setSignOutError(false);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Sign out failed");
      window.location.reload();
    } catch {
      setSignOutError(true);
      setSigningOut(false);
    }
  };

  return (
    <div className={`admin-shell${collapsed ? " is-collapsed" : ""}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <Link href="/admin?tab=hosted" className="admin-brand" aria-label="Admin workspace">
            <span className="admin-brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
            <span className="admin-brand-text">aditya<span>workspace</span></span>
          </Link>
          <div className="admin-sidebar-controls">
            <span className="admin-mobile-theme"><AdminThemeToggle /></span>
            <button type="button" className="admin-collapse-button" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <AdminIcon name="panel" size={17} />
            </button>
          </div>
        </div>

        <div className="admin-sidebar-label">WORKSPACE</div>
        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {sections.map((section) => (
            <Link key={section.id} href={section.href} aria-current={active === section.id ? "page" : undefined} title={collapsed ? section.label : undefined} className={`admin-nav-link${active === section.id ? " is-active" : ""}`}>
              <AdminIcon name={section.icon} size={19} />
              <span>{section.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-footer-tools">
            <AdminThemeToggle />
            <Link href="/" className="admin-site-link" aria-label="View portfolio" title="View portfolio"><AdminIcon name="external" size={17} /></Link>
            <span className={`admin-session-capsule ${countdownTone}`} role="timer" aria-label={`Session expires in ${countdown}`} title={`Session expires in ${countdown}`}>{countdown}</span>
          </div>
          <button type="button" className="admin-logout-button" onClick={() => void signOut()} disabled={signingOut} title="Sign out"><span className="admin-footer-icon"><AdminIcon name="logout" size={18} /></span><span>{signingOut ? "Signing out…" : "Sign out"}</span></button>
          {signOutError ? <span className="admin-logout-error" role="alert">Could not sign out. Try again.</span> : null}
        </div>
      </aside>

      <div className="admin-workspace"><div className="admin-workspace-content">{children}</div></div>
    </div>
  );
}
