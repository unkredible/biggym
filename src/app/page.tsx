import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAppHost, appBaseUrl } from "@/lib/host";

export const dynamic = "force-dynamic";

export default function PortalHome() {
  const host = headers().get("host");
  if (isAppHost(host)) redirect("/dashboard");

  const signup = `${appBaseUrl()}/login`;

  return (
    <main>
      <section style={{ padding: "2rem 0 0.5rem" }}>
        <h1 style={{ fontSize: "clamp(2.4rem,7vw,3.4rem)" }}>biggym</h1>
        <p className="muted" style={{ fontSize: "1.15rem" }}>
          Manage your gym&apos;s clients, workout programs and memberships — in
          one branded app.
        </p>
      </section>

      {/* Pricing */}
      <div className="card accent">
        <p className="muted" style={{ margin: 0 }}>Pricing</p>
        <h2 style={{ margin: "0.2rem 0 0.1rem", fontSize: "2rem" }}>
          €9<span style={{ fontSize: "1rem", fontWeight: 500 }}>/month</span>
        </h2>
        <p style={{ margin: 0, fontWeight: 600 }}>
          + €0.50 per activated client (one-time)
        </p>
        <p className="muted" style={{ margin: "0.3rem 0 0" }}>
          Everything billed together at the end of each month. A client is
          “activated” only when they confirm their email invite.
        </p>
      </div>

      <div className="card">
        <h3>What&apos;s included</h3>
        <ul>
          <li>Unlimited staff & clients</li>
          <li>Workout program builder + client app</li>
          <li>Email invites, roles (admin / reception / trainer)</li>
          <li>Your branding: 5 themes, light/dark, logo & banner</li>
          <li>Multiple locations</li>
        </ul>
      </div>

      <div className="row" style={{ marginTop: "1rem" }}>
        <a href={signup}>
          <button className="primary">Sign up your gym →</button>
        </a>
        <a href={signup} className="muted">Already a customer? Log in</a>
      </div>
    </main>
  );
}
