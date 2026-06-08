import { NextResponse } from "next/server";
import { appBaseUrl, cookieDomain } from "@/lib/host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /logout — clears the Auth.js session cookies and returns to /login.
 * The session cookie is shared across subdomains (Domain=<portal>), so it must
 * be cleared WITH that domain (and with Secure, for the __Secure- prefix).
 */
export async function GET() {
  const res = NextResponse.redirect(`${appBaseUrl()}/login`);
  const domain = cookieDomain();

  // Shared session cookie (has Domain + Secure).
  res.cookies.set("__Secure-authjs.session-token", "", {
    path: "/",
    domain,
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });
  // Also clear host-only variants / csrf / callback, both prefixes.
  for (const n of ["authjs.session-token", "authjs.csrf-token", "authjs.callback-url"]) {
    res.cookies.set(n, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  }
  for (const n of ["__Host-authjs.csrf-token", "__Secure-authjs.callback-url"]) {
    res.cookies.set(n, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: true });
  }
  return res;
}
