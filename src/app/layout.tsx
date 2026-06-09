import type { Metadata } from "next";
import { headers } from "next/headers";
import { Archivo, Inter } from "next/font/google";
import { prisma } from "@/lib/db";
import { isAppHost } from "@/lib/host";
import { currentContext } from "@/lib/gym";
import "./globals.css";

const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
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
}

async function getBrand(): Promise<Brand> {
  const defaults: Brand = {
    appName: null,
    theme: "biggym",
    themeMode: "dark",
    logoUrl: null,
    onApp: false,
    loggedIn: false,
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
      return { ...defaults, onApp, loggedIn };
    }
    const gym = await prisma.gym.findUnique({
      where: { id: ctx.gymId },
      select: { appName: true, theme: true, themeMode: true, logoUrl: true },
    });
    if (!gym) return { ...defaults, onApp, loggedIn };
    return {
      appName: gym.appName,
      theme: gym.theme,
      themeMode: gym.themeMode,
      logoUrl: gym.logoUrl,
      onApp,
      loggedIn,
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

  return (
    <html
      lang="en"
      data-theme={brand.theme}
      data-mode={brand.themeMode}
      className={`${display.variable} ${body.variable}`}
    >
      <body>
        {brand.onApp && (
          <div className="appbar">
            <a href={brand.loggedIn ? "/dashboard" : "/login"} className="brandrow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.loggedIn && brand.logoUrl ? brand.logoUrl : "/brand/logo-mark.webp"}
                alt={brand.appName ?? "BIG GYM"}
              />
              <span className="brandname">
                {brand.loggedIn && brand.appName ? (
                  brand.appName
                ) : (
                  <>
                    BIG <span className="dot">GYM</span>
                  </>
                )}
              </span>
            </a>
            {brand.loggedIn ? (
              <a href="/logout" className="muted" style={{ fontWeight: 600 }}>
                Log out
              </a>
            ) : (
              <a href="/login">
                <button className="primary" style={{ padding: "0.4rem 1.1rem" }}>
                  Log in
                </button>
              </a>
            )}
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
