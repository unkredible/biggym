import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /logout — clears the Auth.js session cookies and returns to /login.
 * A dependable sign-out link (no button / server action needed).
 */
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));
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
