import { NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /logout — clears the Auth.js session cookies and returns to /login.
 * Redirects to the public app host (req.url is the internal 0.0.0.0:3000).
 */
export async function GET() {
  const res = NextResponse.redirect(`${appBaseUrl()}/login`);
  const names = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
  ];
  for (const n of names) res.cookies.set(n, "", { path: "/", maxAge: 0 });
  return res;
}
