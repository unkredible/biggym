import { NextRequest, NextResponse } from "next/server";
import { createGymSubscriptionCheckout } from "@/lib/stripe";
import { portalBaseUrl } from "@/lib/host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/portal/subscribe  { gymName, email }
 * Starts a Stripe subscription Checkout for a new gym. The webhook provisions
 * the gym + owner on completion.
 */
export async function POST(req: NextRequest) {
  let body: { gymName?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const gymName = (body.gymName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  if (!gymName || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Provide a gym name and a valid email." },
      { status: 400 },
    );
  }

  try {
    const base = portalBaseUrl();
    const session = await createGymSubscriptionCheckout({
      gymName,
      email,
      successUrl: `${base}/subscribed?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/?canceled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "checkout failed" },
      { status: 500 },
    );
  }
}
