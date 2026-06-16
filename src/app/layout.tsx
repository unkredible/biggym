import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { Archivo_Black, Inter, JetBrains_Mono } from "next/font/google";
import { prisma } from "@/lib/db";
import { isAppHost } from "@/lib/host";
import { currentContext, currentClient, clientUpcomingBookings, isStaffRole } from "@/lib/gym";
import AppChrome from "@/components/AppChrome";
import "./globals.css";

const SOON_MS = 8 * 60 * 60 * 1000;

const display = Archivo_Black({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BIG GYM — Train Big. Live Bigger.",
  description: "Your all-in-one fitness partner: training, classes, nutrition and progress.",
  icons: { icon: "/brand/logo-app-icon.webp" },
};

interface Brand {
  appName: string | null;
  theme: string;
  themeMode: string;
  logoUrl: string | null;
  onApp: boolean;
  loggedIn: boolean;
  role: string | null;
  baseRole: string | null;
  hasAlerts: boolean;
}

async function getBrand(): Promise<Brand> {
  const defaults: Brand = {
    appName: null,
    theme: "biggym",
    themeMode: "dark",
    logoUrl: null,
    onApp: false,
    loggedIn: false,
    role: null,
    baseRole: null,
    hasAlerts: false,
  };
  try {
    const host = headers().get("host");
    const onApp = isAppHost(host);
    if (!onApp) return defaults;
    const ctx = await currentContext();
    const loggedIn = !!ctx;
    // Gym branding (logo/theme) is applied ONLY in the client's view. Staff and
    // owners (who may manage several gyms) always see the neutral biggym brand.
    if (!ctx?.gymId || ctx.role !== "client") {
      return { ...defaults, onApp, loggedIn, role: ctx?.role ?? null, baseRole: ctx?.baseRole ?? null };
    }
    const [gym, client] = await Promise.all([
      prisma.gym.findUnique({
        where: { id: ctx.gymId },
        select: { appName: true, theme: true, themeMode: true, logoUrl: true },
      }),
      currentClient(),
    ]);
    const hasAlerts = client ? (await clientUpcomingBookings(client.id, SOON_MS)).length > 0 : false;
    if (!gym) return { ...defaults, onApp, loggedIn, role: "client", baseRole: ctx.baseRole, hasAlerts };
    return {
      appName: gym.appName,
      theme: gym.theme,
      themeMode: gym.themeMode,
      logoUrl: gym.logoUrl,
      onApp,
      loggedIn,
      role: "client",
      baseRole: ctx.baseRole,
      hasAlerts,
    };
  } catch {
    return defaults;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brand = await getBrand();
  const isAdmin = brand.baseRole === "gym_admin" || brand.baseRole === "super_admin";
  const inApp = brand.onApp && brand.loggedIn;

  // Theme: portal is always light; in the app honour the user's toggle cookie,
  // falling back to the gym's configured mode.
  const themeCookie = cookies().get("biggym_mode")?.value;
  const mode = !brand.onApp
    ? "light"
    : themeCookie === "light" || themeCookie === "dark"
      ? themeCookie
      : brand.themeMode;

  return (
    <html
      lang="en"
      data-theme={brand.theme}
      data-mode={mode}
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className={inApp ? "has-tabbar" : ""}>
        {inApp ? (
          <AppChrome
            role={brand.role}
            baseStaff={isStaffRole(brand.baseRole)}
            isAdmin={isAdmin}
            hasAlerts={brand.hasAlerts}
          />
        ) : (
          brand.onApp && (
            <div className="appbar">
              <a href="/login" className="brandrow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo-mark.webp" alt="BIG GYM" />
                <span className="brandname">
                  BIG <span className="dot">GYM</span>
                </span>
              </a>
              <a href="/login">
                <button className="primary" style={{ padding: "0.4rem 1.1rem" }}>
                  Log in
                </button>
              </a>
            </div>
          )
        )}
        {children}
      </body>
    </html>
  );
}
