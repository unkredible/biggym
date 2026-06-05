import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole } from "@/lib/gym";
import { sendTenantMail } from "@/lib/mail";
import { appBaseUrl } from "@/lib/host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/clients/invite  { email, fullName? }
 * Staff invites a prospective client. We email them a confirm link; the client
 * becomes "active" (and billable) only when they confirm.
 */
export async function POST(req: NextRequest) {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { email?: string; fullName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

  const gym = await prisma.gym.findUnique({ where: { id: ctx.gymId } });
  if (!gym) return NextResponse.json({ error: "gym not found" }, { status: 404 });

  const token = randomBytes(24).toString("hex");
  await prisma.clientInvite.create({
    data: {
      gymId: ctx.gymId,
      email,
      fullName: body.fullName?.trim() || null,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const link = `${appBaseUrl()}/invite/${token}`;
  await sendTenantMail({
    to: email,
    subject: `${gym.name} invites you to confirm your membership`,
    text:
      `${gym.name} has invited you to join.\n\n` +
      `Confirm your membership here:\n${link}\n\n` +
      `This link expires in 7 days.`,
  }).catch(() => {
    /* surface send issues but don't lose the invite */
  });

  return NextResponse.json({ ok: true });
}
