/**
 * Tenant outbound email via the self-hosted Mailcow SMTP server.
 *
 * Each tenant is provisioned a dedicated mailbox (<tenant_name>@<base-domain>)
 * with its own password, so a tenant can never read or impersonate another
 * tenant's mail.
 */

import nodemailer, { type Transporter } from "nodemailer";
import { getTenant } from "@/lib/tenant";

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

let cachedTransporter: Transporter | null = null;

export function getMailer(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = requireEnv("SMTP_HOST");
  const port = Number.parseInt(requireEnv("SMTP_PORT"), 10);
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    // 465 = implicit TLS, 587 = STARTTLS.
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });

  return cachedTransporter;
}

export interface SendMailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send an email from the tenant's mailbox.
 * The `From:` header is always the tenant SMTP user — anything else would
 * fail SPF/DKIM checks at the recipient.
 */
export async function sendTenantMail(input: SendMailInput) {
  const tenant = getTenant();
  const fromAddress = process.env.SMTP_USER!;
  const fromName = process.env.SMTP_FROM_NAME ?? tenant.name;

  // List-Unsubscribe improves inbox placement and is expected by Gmail/Yahoo
  // bulk-sender rules. Always offer a mailto; offer RFC 8058 one-click only
  // when an HTTPS unsubscribe endpoint is configured.
  const unsubUrl = process.env.UNSUBSCRIBE_URL; // e.g. https://<tenant>/unsubscribe
  const listUnsub = unsubUrl
    ? `<mailto:${fromAddress}?subject=unsubscribe>, <${unsubUrl}>`
    : `<mailto:${fromAddress}?subject=unsubscribe>`;

  const headers: Record<string, string> = {
    // Useful for filtering inbound bounces in Mailcow.
    "X-Tenant-Id": String(tenant.id),
    "X-Tenant-Name": tenant.name,
    "List-Unsubscribe": listUnsub,
    // Disable Brevo open/click tracking. Without this the relay injects a 1x1
    // tracking pixel and rewrites links, which hurts deliverability
    // (HTML_IMAGE_ONLY, missing-alt) and user privacy on transactional mail.
    // Set MAIL_TRACKING=1 (open) or 2 (open+click) to re-enable.
    "X-Mailin-Track": process.env.MAIL_TRACKING ?? "0",
  };
  if (unsubUrl) {
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  // Send text-only by default. We deliberately do NOT auto-generate an HTML
  // part from plain text: the Brevo relay injects a 1x1 open-tracking pixel
  // into any HTML body (hurting privacy + the SpamAssassin HTML_IMAGE_ONLY /
  // missing-alt scores), and there is no reliable per-message header to stop
  // it. A text-only transactional mail gives Brevo nowhere to put the pixel.
  // When the caller explicitly provides HTML, we keep it and add a text
  // alternative for clients that prefer plain text.
  const text =
    input.text ?? (input.html ? htmlToText(input.html) : undefined);
  const html = input.html;

  return getMailer().sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
    subject: input.subject,
    text,
    html,
    replyTo: input.replyTo,
    attachments: input.attachments,
    headers,
  });
}

/** Crude HTML→text fallback for the plain-text alternative part. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
