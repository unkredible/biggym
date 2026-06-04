import { NextRequest, NextResponse } from "next/server";
import { sendTenantMail } from "@/lib/mail";
import { getTenant } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TestEmailBody {
  to?: string;
  subject?: string;
  text?: string;
}

/**
 * POST /api/email/test
 * Sends a smoke-test email via the tenant SMTP credentials.
 * Useful immediately after provisioning to confirm the Mailcow mailbox works.
 */
export async function POST(req: NextRequest) {
  let body: TestEmailBody = {};
  try {
    body = (await req.json()) as TestEmailBody;
  } catch {
    /* allow empty body */
  }

  const tenant = getTenant();
  const to = body.to ?? process.env.SMTP_USER!;
  const subject =
    body.subject ?? `[${tenant.name}] outbound mail smoke test`;
  const text =
    body.text ??
    `If you are reading this, tenant ${tenant.name} (id=${tenant.id}) ` +
      `can send mail via Mailcow. Host: ${tenant.host}.`;

  try {
    const info = await sendTenantMail({ to, subject, text });
    return NextResponse.json({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "send failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
