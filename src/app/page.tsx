import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAppHost, appBaseUrl } from "@/lib/host";

export const dynamic = "force-dynamic";

export default function PortalHome() {
  const host = headers().get("host");
  if (isAppHost(host)) redirect("/dashboard");

  const onboarding = `${appBaseUrl()}/onboarding`;
  const login = `${appBaseUrl()}/login`;

  return (
    <main>
      <section style={{ padding: "2rem 0 0.5rem" }}>
        <h1 style={{ fontSize: "clamp(2.4rem,7vw,3.6rem)" }}>
          Run your gym,
          <br />
          beautifully.
        </h1>
        <p className="muted" style={{ fontSize: "1.15rem" }}>
          Clients, workout programs and memberships — in one branded app.
        </p>
      </section>

      {/* Strong CTA: start gym sign-up right here */}
      <form className="card accent" action={onboarding} method="get">
        <strong style={{ fontSize: "1.1rem" }}>Sign up your gym</strong>
        <p style={{ margin: "0.2rem 0 0.8rem", opacity: 0.85 }}>
          Enter your gym name to get started.
        </p>
        <div className="row" style={{ gap: "0.5rem" }}>
          <input
            name="name"
            placeholder="Big Gym Milano"
            required
            style={{ flex: 1, minWidth: 180, background: "rgba(255,255,255,0.9)", color: "#111" }}
          />
          <button
            type="submit"
            style={{ background: "var(--accent-ink)", color: "var(--accent)", border: 0 }}
          >
            Get started →
          </button>
        </div>
        <p style={{ margin: "0.6rem 0 0", opacity: 0.8, fontSize: "0.85rem" }}>
          If you&apos;re signed in you go straight to payment; otherwise we&apos;ll
          ask you to log in first.
        </p>
      </form>

      {/* Pricing */}
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>Pricing</p>
        <h2 style={{ margin: "0.2rem 0 0.1rem", fontSize: "2rem" }}>
          €9<span style={{ fontSize: "1rem", fontWeight: 500 }}>/month</span>
        </h2>
        <p style={{ margin: 0, fontWeight: 600 }}>+ €0.50 per activated client (one-time)</p>
        <p className="muted" style={{ margin: "0.3rem 0 0" }}>
          Billed together at the end of each month. A client counts only when they
          confirm their email invite.
        </p>
      </div>

      <div className="card">
        <h3>What&apos;s included</h3>
        <ul>
          <li>Unlimited staff &amp; clients</li>
          <li>Workout program builder + client app</li>
          <li>Email invites, roles (admin / reception / trainer)</li>
          <li>Your branding: 5 themes, light/dark, logo &amp; banner</li>
          <li>Multiple locations</li>
        </ul>
      </div>

      <p className="muted">
        Already a customer? <a href={login}>Log in →</a>
      </p>
    </main>
  );
}
