import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructStripeEvent } from "@/lib/stripe";
import { provisionGym } from "@/lib/gym";
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
      const meta = session.metadata ?? {};
      if (meta.purpose !== "gym_signup") return;

      const gymName = meta.gym_name ?? "My gym";
      const ownerEmail =
        meta.owner_email ?? session.customer_details?.email ?? session.customer_email ?? "";
      if (!ownerEmail) return;

      const { gym } = await provisionGym({
        gymName,
        ownerEmail,
        stripeCustomerId:
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null,
        stripeSubscriptionId:
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null,
      });

      const loginUrl = `${appBaseUrl()}/login`;
      await sendTenantMail({
        to: ownerEmail,
        subject: `Your ${gym.name} workspace is ready`,
        text:
          `Welcome to biggym.\n\n` +
          `Your gym "${gym.name}" is active. Sign in to manage clients and ` +
          `workout programs:\n${loginUrl}\n\n` +
          `Use this email address to receive a magic sign-in link, or set a ` +
          `password from the login page.`,
      }).catch(() => {
        /* email failure shouldn't fail the webhook */
      });
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
