import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { setGymUnitPrice } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/gym-rate  { gymId, cents | null }
 * cents=null clears the override → gym uses the platform default.
 */
export async function POST(req: NextRequest) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { gymId?: string; cents?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!body.gymId) {
    return NextResponse.json({ error: "gymId required" }, { status: 400 });
  }
  try {
    const cents =
      body.cents === null || body.cents === undefined ? null : Number(body.cents);
    await setGymUnitPrice(body.gymId, cents);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 400 },
    );
  }
}
