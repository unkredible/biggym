import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { billPeriod } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bill  { period? }
 * Aggregates unbilled activations into one Stripe invoice item per gym.
 * Also usable from a monthly cron (with the admin session cookie or, later,
 * a service token).
 */
export async function POST(req: NextRequest) {
  // Allow either a logged-in super admin (dashboard button) or a cron call
  // carrying the shared BILLING_CRON_TOKEN (for the monthly automated run).
  const cronToken = process.env.BILLING_CRON_TOKEN;
  const headerToken = req.headers.get("x-cron-token");
  const cronOk = !!cronToken && headerToken === cronToken;

  if (!cronOk && !(await requireSuperAdmin())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let period: string | undefined;
  try {
    const body = await req.json();
    period = body?.period;
  } catch {
    /* no body = bill all unbilled */
  }
  try {
    const results = await billPeriod(period);
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
