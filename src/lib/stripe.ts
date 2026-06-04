/**
 * Stripe wrapper for biggym.
 *
 * Portal flow: a prospective gym subscribes from biggym.unkredible.com. We
 * create a subscription Checkout session tagged with the gym name + a marker
 * so the webhook can provision the gym (Gym + owner User + Membership) on
 * `checkout.session.completed`.
 */

import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not set");
  cached = new Stripe(secret, {
    apiVersion: "2024-11-20.acacia",
    appInfo: { name: "biggym", version: "0.1.0" },
  });
  return cached;
}

export interface GymCheckoutInput {
  gymName: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  priceId?: string;
}

export async function createGymSubscriptionCheckout(
  input: GymCheckoutInput,
): Promise<Stripe.Checkout.Session> {
  const priceId = input.priceId ?? process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error("No price configured (set STRIPE_PRICE_ID)");
  }
  const metadata = {
    purpose: "gym_signup",
    gym_name: input.gymName,
    owner_email: input.email.toLowerCase(),
  };
  return getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: input.email,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata,
    subscription_data: { metadata },
    allow_promotion_codes: true,
  });
}

export function constructStripeEvent(
  rawBody: string,
  signature: string | null,
): Stripe.Event {
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  if (!signature) throw new Error("Missing Stripe-Signature header");
  return getStripe().webhooks.constructEvent(rawBody, signature, whSecret);
}
