"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import { usePathname } from "next/navigation";
import ViewToggle from "@/components/ViewToggle";
import {
  IconMenu, IconBell, IconClose, IconHome, IconDumbbell, IconCalendar,
  IconChart, IconUser, IconUsers, IconTag, IconSettings, IconLogout,
} from "@/components/icons";

type Ico = ComponentType<SVGProps<SVGSVGElement>>;
interface Tab { href: string; label: string; Icon: Ico; exact?: boolean; match?: string[] }

const CLIENT_TABS: Tab[] = [
  { href: "/dashboard", label: "Dashboard", Icon: IconHome, exact: true },
  { href: "/my/workouts", label: "Workout", Icon: IconDumbbell },
  { href: "/my/calendar", label: "Calendar", Icon: IconCalendar },
  { href: "/progress", label: "Progress", Icon: IconChart },
  { href: "/profile", label: "Profile", Icon: IconUser },
];

function staffTabs(isAdmin: boolean): Tab[] {
  const t: Tab[] = [
    { href: "/dashboard", label: "Dashboard", Icon: IconHome, exact: true },
    { href: "/people", label: "Persone", Icon: IconUsers, match: ["/people", "/clients", "/staff"] },
    { href: "/calendar", label: "Calendar", Icon: IconCalendar },
  ];
  if (isAdmin) t.push({ href: "/plans", label: "Piani", Icon: IconTag });
  t.push({ href: "/settings", label: "Profilo", Icon: IconSettings });
  return t;
}

export default function AppChrome({
  role,
  baseStaff,
  isAdmin,
  hasAlerts,
}: {
  role: string | null;
  baseStaff: boolean;
  isAdmin: boolean;
  hasAlerts: boolean;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname() || "";
  const isClient = role === "client";
  const tabs = isClient ? CLIENT_TABS : staffTabs(isAdmin);

  const active = (t: Tab) => {
    if (t.exact) return path === t.href;
    if (t.match) return t.match.some((m) => path.startsWith(m));
    return path.startsWith(t.href);
  };

  return (
    <>
      <header className="appshell-top">
        <button className="iconbtn" aria-label="Menu" onClick={() => setOpen(true)}>
          <IconMenu />
        </button>
        <a className="brandname" href="/dashboard" style={{ fontSize: "1rem" }}>
          BIG <span className="dot">GYM</span>
        </a>
        {isClient ? (
          <a className="iconbtn" aria-label="Notifiche" href="/my/notifications">
            <IconBell />
            {hasAlerts && <span className="badge-dot" />}
          </a>
        ) : (
          <span className="iconbtn" aria-hidden style={{ visibility: "hidden" }} />
        )}
      </header>

      {open && (
        <div className="drawer" onClick={() => setOpen(false)}>
          <nav className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="row spread" style={{ marginBottom: "1rem" }}>
              <span className="brandname">BIG <span className="dot">GYM</span></span>
              <button className="iconbtn" aria-label="Chiudi" onClick={() => setOpen(false)}>
                <IconClose />
              </button>
            </div>

            {isClient && (
              <a className="drawer-link" href="/profile" onClick={() => setOpen(false)}>
                <IconUser width={19} height={19} /> Il mio profilo
              </a>
            )}
            {!isClient && baseStaff && (
              <ViewToggle mode="client" className="drawer-link">
                <IconDumbbell width={19} height={19} /> Allenati
              </ViewToggle>
            )}
            {isClient && baseStaff && (
              <ViewToggle mode="staff" className="drawer-link">
                <IconSettings width={19} height={19} /> Torna a gestione
              </ViewToggle>
            )}
            <a className="drawer-link" href="/settings" onClick={() => setOpen(false)}>
              <IconSettings width={19} height={19} /> Impostazioni
            </a>
            <a className="drawer-link" href="/logout">
              <IconLogout width={19} height={19} /> Esci
            </a>
          </nav>
        </div>
      )}

      <nav className="tabbar">
        {tabs.map((t) => (
          <a key={t.href} href={t.href} className={`tab${active(t) ? " on" : ""}`}>
            <span className="tab-ic"><t.Icon /></span>
            <span className="tab-lb">{t.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
