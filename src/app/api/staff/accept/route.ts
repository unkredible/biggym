import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/staff/accept { token } — the invited user (signed in with the
 * invited email) joins the gym with the invited role.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "sign in first" }, { status: 401 });
  }
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const invite = await prisma.staffInvite.findUnique({
    where: { token: body.token ?? "" },
  });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "invalid or expired invite" }, { status: 410 });
  }
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json(
      { error: `Sign in with ${invite.email} to accept.` },
      { status: 403 },
    );
  }

  // A user can belong to many gyms — only create if not already in THIS gym.
  const existing = await prisma.membership.findFirst({
    where: { userId: session.user.id, gymId: invite.gymId },
    select: { id: true },
  });
  if (!existing) {
    await prisma.membership.create({
      data: {
        gymId: invite.gymId,
        userId: session.user.id,
        role: invite.role,
        fullName: invite.fullName ?? session.user.name ?? invite.email,
        email: invite.email,
      },
    });
  }

  if (!invite.acceptedAt) {
    await prisma.staffInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
