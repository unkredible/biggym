import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { slugify } from "@/lib/gym";
import { createGymSubscriptionCheckout } from "@/lib/stripe";
import { appBaseUrl } from "@/lib/host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/onboarding { gymName, password }
 * Called after the user confirmed their email (magic-link) and is signed in.
 * Sets their password, creates the gym (trial) + gym_admin membership, then
 * returns a Stripe Checkout URL to activate the subscription.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "sign in first" }, { status: 401 });
  }

  // Already onboarded?
  const existing = await prisma.membership.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "already has a gym" }, { status: 409 });
  }

  let body: { gymName?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const gymName = (body.gymName ?? "").trim();
  if (!gymName) return NextResponse.json({ error: "Gym name required." }, { status: 400 });

  // Reject a duplicate gym name (case-insensitive).
  const dup = await prisma.gym.findFirst({
    where: { name: { equals: gymName, mode: "insensitive" } },
    select: { id: true },
  });
  if (dup) {
    return NextResponse.json(
      { error: "A gym with this name already exists." },
      { status: 409 },
    );
  }

  // Only ask for a password if the account doesn't have one yet (e.g. first
  // sign-up via magic link). An already-authenticated user keeps their login.
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!me?.passwordHash) {
    const password = body.password ?? "";
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: await hashPassword(password) },
    });
  }

  // Create gym (trial) + owner membership.
  let slug = slugify(gymName);
  for (let i = 0; i < 5; i++) {
    if (!(await prisma.gym.findUnique({ where: { slug } }))) break;
    slug = `${slugify(gymName)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  const gym = await prisma.gym.create({
    data: {
      name: gymName,
      slug,
      status: "trial",
      subscriptionStatus: "none",
      appName: gymName,
      contactEmail: session.user.email,
    },
  });
  await prisma.membership.create({
    data: {
      gymId: gym.id,
      userId: session.user.id,
      role: "gym_admin",
      fullName: gymName,
      email: session.user.email,
    },
  });

  // Checkout to activate.
  try {
    const base = appBaseUrl();
    const co = await createGymSubscriptionCheckout({
      gymId: gym.id,
      email: session.user.email,
      successUrl: `${base}/dashboard?subscribed=1`,
      cancelUrl: `${base}/dashboard?pending=1`,
    });
    return NextResponse.json({ url: co.url });
  } catch (err) {
    // Gym created in trial even if checkout couldn't start.
    return NextResponse.json(
      { ok: true, url: null, warn: err instanceof Error ? err.message : "checkout unavailable" },
    );
  }
}
