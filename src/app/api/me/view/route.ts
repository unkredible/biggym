import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole, VIEW_COOKIE } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST { mode: "client" | "staff" } — switch how a staff user sees their own
 *  gym. Going to "client" creates a Client row for them if missing (no billing
 *  activation is recorded). */
export async function POST(req: NextRequest) {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.baseRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let mode = "staff";
  try {
    const b = await req.json();
    mode = b?.mode === "client" ? "client" : "staff";
  } catch {
    // default staff
  }

  if (mode === "client") {
    const existing = await prisma.client.findFirst({
      where: { userId: ctx.userId, gymId: ctx.gymId },
      select: { id: true },
    });
    if (!existing) {
      const m = await prisma.membership.findFirst({
        where: { userId: ctx.userId, gymId: ctx.gymId },
        select: { fullName: true, email: true },
      });
      await prisma.client.create({
        data: {
          gymId: ctx.gymId,
          userId: ctx.userId,
          fullName: m?.fullName || ctx.email,
          email: m?.email || ctx.email,
          onboardingStatus: "active",
        },
      });
    }
  }

  cookies().set(VIEW_COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.json({ ok: true, mode });
}
