"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/my/workouts", label: "Workout", icon: "🏋️" },
  { href: "/my/calendar", label: "Calendar", icon: "📅" },
  { href: "/progress", label: "Progress", icon: "📊" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function ClientChrome({ hasAlerts }: { hasAlerts: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname() || "";

  const active = (href: string) =>
    href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);

  return (
    <>
      <header className="appshell-top">
        <button className="iconbtn" aria-label="Menu" onClick={() => setOpen(true)}>☰</button>
        <a className="brandname" href="/dashboard" style={{ fontSize: "1rem" }}>
          BIG <span className="dot">GYM</span>
        </a>
        <a className="iconbtn" aria-label="Notifications" href="/my/notifications">
          🔔{hasAlerts && <span className="badge-dot" />}
        </a>
      </header>

      {open && (
        <div className="drawer" onClick={() => setOpen(false)}>
          <nav className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="row spread" style={{ marginBottom: "1rem" }}>
              <span className="brandname">BIG <span className="dot">GYM</span></span>
              <button className="iconbtn" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <a className="drawer-link" href="/profile" onClick={() => setOpen(false)}>👤 Il mio profilo</a>
            <a className="drawer-link" href="/settings" onClick={() => setOpen(false)}>⚙️ Impostazioni profilo</a>
            <a className="drawer-link" href="/logout">🚪 Esci</a>
          </nav>
        </div>
      )}

      <nav className="tabbar">
        {TABS.map((t) => (
          <a key={t.href} href={t.href} className={`tab${active(t.href) ? " on" : ""}`}>
            <span className="tab-ic">{t.icon}</span>
            <span className="tab-lb">{t.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
