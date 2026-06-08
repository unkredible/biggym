import { NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /logout — clears the Auth.js session cookies and returns to /login.
 *
 * On HTTPS the session cookie is named "__Secure-authjs.session-token"; a
 * browser refuses a Set-Cookie for a "__Secure-"/"__Host-" name unless the
 * Secure attribute is present, so we must clear those WITH secure:true.
 */
export async function GET() {
  const res = NextResponse.redirect(`${appBaseUrl()}/login`);

  const insecure = ["authjs.session-token", "authjs.csrf-token", "authjs.callback-url"];
  const secure = [
    "__Secure-authjs.session-token",
    "__Host-authjs.csrf-token",
    "__Secure-authjs.callback-url",
  ];

  for (const n of insecure) {
    res.cookies.set(n, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  }
  for (const n of secure) {
    res.cookies.set(n, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: true });
  }
  return res;
}
