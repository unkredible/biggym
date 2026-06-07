import type { Metadata } from "next";
import { headers } from "next/headers";
import { Space_Grotesk, Inter } from "next/font/google";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppHost } from "@/lib/host";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "biggym",
  description: "Gym management made simple — clients, workout programs, billing.",
};

interface Brand {
  appName: string | null;
  theme: string;
  themeMode: string;
  logoUrl: string | null;
  onApp: boolean;
}

async function getBrand(): Promise<Brand> {
  const defaults: Brand = {
    appName: null,
    theme: "emerald",
    themeMode: "dark",
    logoUrl: null,
    onApp: false,
  };
  try {
    const host = headers().get("host");
    const onApp = isAppHost(host);
    if (!onApp) return defaults;
    const session = await auth();
    const gymId = session?.user?.gymId;
    if (!gymId) return { ...defaults, onApp };
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      select: { appName: true, theme: true, themeMode: true, logoUrl: true },
    });
    if (!gym) return { ...defaults, onApp };
    return {
      appName: gym.appName,
      theme: gym.theme,
      themeMode: gym.themeMode,
      logoUrl: gym.logoUrl,
      onApp,
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
            <a href="/dashboard" className="brandrow">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt={brand.appName ?? "logo"} />
              ) : null}
              <span className="brandname">
                {brand.appName ?? (
                  <>
                    big<span className="dot">gym</span>
                  </>
                )}
              </span>
            </a>
            <a href="/logout" className="muted" style={{ fontWeight: 600 }}>
              Sign out
            </a>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
