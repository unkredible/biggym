import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";
import { sendTenantMail } from "@/lib/mail";
import { appBaseUrl } from "@/lib/host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVITABLE = new Set(["gym_admin", "reception", "trainer"]);

/** POST /api/staff/invite { email, role, fullName? } — gym_admin only. */
export async function POST(req: NextRequest) {
  const ctx = await currentContext();
  if (!ctx?.gymId || ctx.role !== "gym_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { email?: string; role?: string; fullName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const role = body.role ?? "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }
  if (!INVITABLE.has(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const gym = await prisma.gym.findUnique({ where: { id: ctx.gymId } });
  if (!gym) return NextResponse.json({ error: "gym not found" }, { status: 404 });

  const token = randomBytes(24).toString("hex");
  await prisma.staffInvite.create({
    data: {
      gymId: ctx.gymId,
      email,
      role: role as "gym_admin" | "reception" | "trainer",
      fullName: body.fullName?.trim() || null,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const link = `${appBaseUrl()}/staff/accept/${token}`;
  await sendTenantMail({
    to: email,
    subject: `You've been added to ${gym.name} on biggym`,
    text:
      `${gym.name} invited you as ${role}.\n\n` +
      `Accept and sign in here:\n${link}\n\n` +
      `Sign in with THIS email address (${email}). Link expires in 7 days.`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
