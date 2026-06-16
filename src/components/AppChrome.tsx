"use client";

import { type ComponentType, type SVGProps } from "react";
import { usePathname } from "next/navigation";
import ViewSwitch from "@/components/ViewSwitch";
import ThemeToggle from "@/components/ThemeToggle";
import {
  IconHome, IconCalendar, IconDoc, IconCard, IconBell, IconSettings,
  IconUsers, IconTag, IconLogout, IconActivity,
} from "@/components/icons";

type Ico = ComponentType<SVGProps<SVGSVGElement>>;
interface Tab { href: string; label: string; Icon: Ico; exact?: boolean; match?: string[] }

const CLIENT_NAV: Tab[] = [
  { href: "/dashboard", label: "Dashboard", Icon: IconHome, exact: true },
  { href: "/my/calendar", label: "Corsi", Icon: IconCalendar },
  { href: "/my/workouts", label: "Schede", Icon: IconDoc },
  { href: "/membership", label: "Abbonamento", Icon: IconCard },
  { href: "/my/notifications", label: "Notifiche", Icon: IconBell },
  { href: "/settings", label: "Impostazioni", Icon: IconSettings },
];

function staffNav(isAdmin: boolean): Tab[] {
  const t: Tab[] = [
    { href: "/dashboard", label: "Dashboard", Icon: IconHome, exact: true },
    { href: "/calendar", label: "Calendario", Icon: IconCalendar },
    { href: "/people", label: "Clienti", Icon: IconUsers, match: ["/people", "/clients", "/staff"] },
  ];
  if (isAdmin) t.push({ href: "/plans", label: "Abbonamenti", Icon: IconTag });
  t.push({ href: "/settings", label: "Impostazioni", Icon: IconSettings });
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
  const path = usePathname() || "";
  const isClient = role === "client";
  const nav = isClient ? CLIENT_NAV : staffNav(isAdmin);
  const mobileNav = nav.slice(0, 4);
  const current: "staff" | "client" = isClient ? "client" : "staff";

  const active = (t: Tab) => {
    if (t.exact) return path === t.href;
    if (t.match) return t.match.some((m) => path.startsWith(m));
    return path.startsWith(t.href);
  };

  const Brand = (
    <a href="/dashboard" className="side-brand" style={{ marginBottom: 0 }}>
      <span className="side-dot"><i /></span>
      <span>
        <span className="eyebrow" style={{ display: "block" }}>GymFlow</span>
        <span className="brandname" style={{ fontSize: "0.95rem" }}>BIG <span className="dot">GYM</span></span>
      </span>
    </a>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="side">
        <div style={{ marginBottom: "1.5rem" }}>{Brand}</div>
        <nav className="side-nav">
          {nav.map((t) => (
            <a key={t.href} href={t.href} className={`side-link${active(t) ? " on" : ""}`}>
              <t.Icon width={18} height={18} />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
        <div className="side-foot">
          {baseStaff && <ViewSwitch current={current} />}
          <div className="row" style={{ gap: "0.5rem" }}>
            <ThemeToggle />
            <a href="/logout" className="iconbtn" aria-label="Esci"><IconLogout /></a>
            <span className="row" style={{ gap: "0.35rem", marginLeft: "auto", color: "var(--muted)" }}>
              <IconActivity width={14} height={14} style={{ color: "var(--accent)" }} />
              <span className="eyebrow">{isClient ? "Membro" : "Back-office"}</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="appshell-top">
        {Brand}
        <div className="row" style={{ gap: "0.45rem" }}>
          {baseStaff && <ViewSwitch current={current} compact />}
          <ThemeToggle />
          {isClient && (
            <a className="iconbtn" aria-label="Notifiche" href="/my/notifications">
              <IconBell />
              {hasAlerts && <span className="badge-dot" />}
            </a>
          )}
          <a className="iconbtn" aria-label="Impostazioni" href="/settings"><IconSettings /></a>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="tabbar">
        {mobileNav.map((t) => (
          <a key={t.href} href={t.href} className={`tab${active(t) ? " on" : ""}`}>
            <span className="tab-ic"><t.Icon /></span>
            <span className="tab-lb">{t.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
