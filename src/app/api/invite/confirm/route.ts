import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordActivation } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/invite/confirm  { token, fullName, phone? }
 * Public (token-authenticated). Creates/activates the client and records the
 * single billable activation. Idempotent on the invite.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; fullName?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const token = body.token ?? "";
  const invite = await prisma.clientInvite.findUnique({ where: { token } });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "invalid or expired invite" }, { status: 410 });
  }
  if (invite.acceptedAt && invite.clientId) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const fullName = (body.fullName ?? invite.fullName ?? invite.email).trim();

  // Reuse an existing client with the same email in this gym, else create.
  let client =
    (await prisma.client.findFirst({
      where: { gymId: invite.gymId, email: invite.email },
    })) ??
    (await prisma.client.create({
      data: {
        gymId: invite.gymId,
        fullName,
        email: invite.email,
        phone: body.phone?.trim() || null,
        onboardingStatus: "lead",
      },
    }));

  // Activate + record exactly one billable unit.
  await recordActivation(invite.gymId, client.id);

  // Give the client a login: a User + a client Membership, linked to the
  // Client record, so they can sign in and see their own workouts.
  const user = await prisma.user.upsert({
    where: { email: invite.email },
    create: { email: invite.email, name: fullName },
    update: {},
  });
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id, gymId: invite.gymId },
    select: { id: true },
  });
  if (!existingMembership) {
    await prisma.membership.create({
      data: {
        gymId: invite.gymId,
        userId: user.id,
        role: "client",
        fullName,
        email: invite.email,
      },
    });
  }
  if (!client.userId) {
    await prisma.client
      .update({ where: { id: client.id }, data: { userId: user.id } })
      .catch(() => {/* userId may already be linked to another client */});
  }

  await prisma.clientInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date(), clientId: client.id },
  });

  return NextResponse.json({ ok: true });
}
