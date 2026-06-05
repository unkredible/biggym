import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppHost } from "@/lib/host";
import "./globals.css";

export const metadata: Metadata = {
  title: "biggym",
  description: "Gym management made simple — clients, workout programs, billing.",
};

/** Resolve the signed-in user's gym branding (app host only). */
async function getBrand() {
  try {
    const host = headers().get("host");
    if (!isAppHost(host)) return null;
    const session = await auth();
    const gymId = session?.user?.gymId;
    if (!gymId) return null;
    return prisma.gym.findUnique({
      where: { id: gymId },
      select: { appName: true, primaryColor: true, accentColor: true },
    });
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brand = await getBrand();

  return (
    <html lang="en">
      <head>
        {brand && (
          <style>{`:root{--accent:${brand.primaryColor};--accent2:${brand.accentColor};}`}</style>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
