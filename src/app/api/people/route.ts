import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — staff + clients of the active gym, for the unified People view. */
export async function GET() {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const [staff, clients, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { gymId: ctx.gymId },
      orderBy: { createdAt: "asc" },
      select: { id: true, fullName: true, email: true, role: true, active: true },
    }),
    prisma.client.findMany({
      where: { gymId: ctx.gymId },
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, email: true, phone: true, onboardingStatus: true },
    }),
    prisma.staffInvite.findMany({
      where: { gymId: ctx.gymId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true },
    }),
  ]);
  return NextResponse.json({
    canManageStaff: ctx.role === "gym_admin",
    staff,
    clients,
    pendingStaff: invites,
  });
}
