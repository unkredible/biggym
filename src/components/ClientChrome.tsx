"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  IconMenu, IconBell, IconClose, IconHome, IconDumbbell, IconCalendar,
  IconChart, IconUser, IconSettings, IconLogout,
} from "@/components/icons";

const TABS = [
  { href: "/dashboard", label: "Dashboard", Icon: IconHome },
  { href: "/my/workouts", label: "Workout", Icon: IconDumbbell },
  { href: "/my/calendar", label: "Calendar", Icon: IconCalendar },
  { href: "/progress", label: "Progress", Icon: IconChart },
  { href: "/profile", label: "Profile", Icon: IconUser },
];

export default function ClientChrome({ hasAlerts }: { hasAlerts: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname() || "";

  const active = (href: string) =>
    href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);

  return (
    <>
      <header className="appshell-top">
        <button className="iconbtn" aria-label="Menu" onClick={() => setOpen(true)}>
          <IconMenu />
        </button>
        <a className="brandname" href="/dashboard" style={{ fontSize: "1rem" }}>
          BIG <span className="dot">GYM</span>
        </a>
        <a className="iconbtn" aria-label="Notifications" href="/my/notifications">
          <IconBell />
          {hasAlerts && <span className="badge-dot" />}
        </a>
      </header>

      {open && (
        <div className="drawer" onClick={() => setOpen(false)}>
          <nav className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="row spread" style={{ marginBottom: "1rem" }}>
              <span className="brandname">BIG <span className="dot">GYM</span></span>
              <button className="iconbtn" aria-label="Close" onClick={() => setOpen(false)}>
                <IconClose />
              </button>
            </div>
            <a className="drawer-link" href="/profile" onClick={() => setOpen(false)}>
              <IconUser width={19} height={19} /> Il mio profilo
            </a>
            <a className="drawer-link" href="/settings" onClick={() => setOpen(false)}>
              <IconSettings width={19} height={19} /> Impostazioni profilo
            </a>
            <a className="drawer-link" href="/logout">
              <IconLogout width={19} height={19} /> Esci
            </a>
          </nav>
        </div>
      )}

      <nav className="tabbar">
        {TABS.map(({ href, label, Icon }) => (
          <a key={href} href={href} className={`tab${active(href) ? " on" : ""}`}>
            <span className="tab-ic"><Icon /></span>
            <span className="tab-lb">{label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
