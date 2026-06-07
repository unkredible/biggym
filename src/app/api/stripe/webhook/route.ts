import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructStripeEvent } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { sendTenantMail } from "@/lib/mail";
import { appBaseUrl } from "@/lib/host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/webhook
 *
 * checkout.session.completed (purpose=gym_signup) → provision the gym + owner
 * and email them their app login link. subscription.* → keep the gym's
 * subscriptionStatus in sync. Idempotent via the StripeEvent table.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = constructStripeEvent(rawBody, signature);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "bad signature" },
      { status: 400 },
    );
  }

  const seen = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (seen) return NextResponse.json({ ok: true, duplicate: true });

  try {
    await handle(event);
    await prisma.stripeEvent.create({
      data: { id: event.id, type: event.type },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "handler failed" },
      { status: 500 },
    );
  }
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const gymId = session.metadata?.gym_id;
      if (!gymId) return;

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      const gym = await prisma.gym.update({
        where: { id: gymId },
        data: {
          status: "active",
          subscriptionStatus: "active",
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subId ?? undefined,
        },
      });

      // Courtesy confirmation email.
      if (gym.contactEmail) {
        await sendTenantMail({
          to: gym.contactEmail,
          subject: `${gym.name}: subscription confirmed 🎉`,
          text:
            `Thanks for subscribing to biggym.\n\n` +
            `Your subscription for "${gym.name}" is active. Plan: €9/month + ` +
            `€0.50 per activated client, billed at month end.\n\n` +
            `Open your app: ${appBaseUrl()}/dashboard`,
        }).catch(() => {});
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await prisma.gym.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          subscriptionStatus: sub.status,
          status: sub.status === "active" ? "active" : "suspended",
        },
      });
      break;
    }

    default:
      break;
  }
}
