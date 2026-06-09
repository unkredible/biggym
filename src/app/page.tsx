import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAppHost, appBaseUrl } from "@/lib/host";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const host = headers().get("host");
  if (isAppHost(host)) redirect("/dashboard");

  const session = await auth();
  const loggedIn = !!session?.user;
  const onboarding = `${appBaseUrl()}/onboarding`;
  const login = `${appBaseUrl()}/login`;
  const appHome = `${appBaseUrl()}/dashboard`;

  return (
    <main>
      {/* Nav */}
      <nav className="lp-nav">
        <span className="brandrow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.webp" alt="BIG GYM" style={{ height: 34 }} />
          <span className="brandname" style={{ fontSize: "1.35rem" }}>
            BIG <span className="dot">GYM</span>
          </span>
        </span>
        <div className="row" style={{ gap: "0.6rem" }}>
          {loggedIn ? (
            <a href={appHome}>
              <button className="primary" style={{ padding: "0.45rem 1.1rem" }}>
                Go to app →
              </button>
            </a>
          ) : (
            <>
              <a href={login} className="muted" style={{ fontWeight: 600 }}>Log in</a>
              <a href="#signup">
                <button className="primary" style={{ padding: "0.45rem 1.1rem" }}>Sign up</button>
              </a>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "1.5rem 0 0.5rem" }}>
        <span className="lp-eyebrow">Gym management, done right</span>
        <h1 className="lp-hero-h">
          Run your gym,
          <br />
          <span style={{ color: "var(--accent)" }}>beautifully.</span>
        </h1>
        <p className="muted" style={{ fontSize: "1.2rem", maxWidth: 560 }}>
          Clients, workout programs, memberships and billing — in one branded app
          your members will actually love.
        </p>
        <div className="row" style={{ gap: "0.6rem", marginTop: "1.2rem" }}>
          <a href="#signup"><button className="primary">Start your gym →</button></a>
          {loggedIn ? (
            <a href={appHome} className="muted" style={{ fontWeight: 600 }}>Go to your app →</a>
          ) : (
            <a href={login} className="muted" style={{ fontWeight: 600 }}>I already have an account</a>
          )}
        </div>
      </section>

      {/* Features */}
      <h2 className="lp-section-title">Everything in one place</h2>
      <div className="lp-grid">
        {[
          { ic: "👥", t: "Clients & CRM", d: "Records, onboarding status, history and staff assignment." },
          { ic: "🏋️", t: "Workout builder", d: "Build programs (days, exercises, sets/reps) your clients see in their app." },
          { ic: "🎨", t: "Your branding", d: "5 themes, light/dark, your logo & banner — it feels like your app." },
          { ic: "📍", t: "Multiple locations", d: "Manage several sites under one gym account." },
        ].map((f) => (
          <div className="card lp-feature" key={f.t}>
            <div className="ic">{f.ic}</div>
            <h3 style={{ margin: "0.4rem 0 0.2rem" }}>{f.t}</h3>
            <p className="muted" style={{ margin: 0 }}>{f.d}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <h2 className="lp-section-title">How it works</h2>
      <div className="lp-steps">
        {[
          { n: 1, t: "Sign up your gym", d: "Confirm your email, set a password, subscribe." },
          { n: 2, t: "Invite your clients", d: "They confirm by email — you only pay for confirmed clients." },
          { n: 3, t: "Train & track", d: "Assign programs; clients view workouts and log sets in the app." },
        ].map((s) => (
          <div className="card lp-step" key={s.n}>
            <span className="n">{s.n}</span>
            <h3 style={{ margin: "0.5rem 0 0.2rem" }}>{s.t}</h3>
            <p className="muted" style={{ margin: 0 }}>{s.d}</p>
          </div>
        ))}
      </div>

      {/* Pricing + sign-up CTA */}
      <h2 className="lp-section-title" id="signup">Simple pricing</h2>
      <div className="lp-grid">
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Pay as you grow</p>
          <h2 style={{ margin: "0.2rem 0 0.1rem", fontSize: "2.4rem" }}>
            €9<span style={{ fontSize: "1rem", fontWeight: 500 }}>/month</span>
          </h2>
          <p style={{ margin: 0, fontWeight: 600 }}>+ €0.50 per activated client</p>
          <p className="muted" style={{ margin: "0.4rem 0 0" }}>
            One invoice at month end. A client counts only when they confirm their
            email invite — no surprises.
          </p>
          <ul style={{ marginTop: "0.8rem" }}>
            <li>Unlimited staff &amp; clients</li>
            <li>Roles: admin / reception / trainer</li>
            <li>Multiple locations</li>
            <li>Cancel anytime</li>
          </ul>
        </div>

        <form className="card accent" action={onboarding} method="get">
          <strong style={{ fontSize: "1.2rem" }}>Create your gym</strong>
          <p style={{ margin: "0.2rem 0 0.8rem", opacity: 0.85 }}>Takes a minute.</p>
          <input
            name="name"
            placeholder="Your gym name"
            required
            style={{ width: "100%", background: "rgba(255,255,255,0.92)", color: "#111" }}
          />
          <button
            type="submit"
            style={{ width: "100%", marginTop: "0.6rem", background: "var(--accent-ink)", color: "var(--accent)", border: 0 }}
          >
            Get started →
          </button>
          <p style={{ margin: "0.7rem 0 0", opacity: 0.8, fontSize: "0.85rem" }}>
            Signed in? You go straight to payment. Otherwise we&apos;ll ask you to
            log in first.
          </p>
        </form>
      </div>

      {/* FAQ */}
      <h2 className="lp-section-title">Questions</h2>
      {[
        { q: "When is a client billed?", a: "Only when they accept your email invite and confirm — €0.50 once, then nothing more for that client." },
        { q: "Can my clients use it on their phone?", a: "Yes — it's a web app they open in the browser and can add to their home screen." },
        { q: "Can I cancel?", a: "Anytime. You keep access until the end of the billing period." },
      ].map((f) => (
        <div className="card" key={f.q}>
          <strong>{f.q}</strong>
          <p className="muted" style={{ margin: "0.3rem 0 0" }}>{f.a}</p>
        </div>
      ))}

      <div className="row" style={{ marginTop: "1.5rem" }}>
        <a href="#signup"><button className="primary">Start your gym →</button></a>
      </div>

      <footer className="lp-foot">
        <div className="row spread">
          <span>BIG GYM © {new Date().getFullYear()}</span>
          <a href={login} className="muted">Log in</a>
        </div>
      </footer>
    </main>
  );
}
