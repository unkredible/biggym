import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAppHost, appBaseUrl } from "@/lib/host";
import SubscribeForm from "./_components/SubscribeForm";

export const dynamic = "force-dynamic";

export default function PortalHome() {
  // On the app host, "/" is the app — send users to the dashboard/login.
  const host = headers().get("host");
  if (isAppHost(host)) redirect("/dashboard");

  return (
    <main>
      <section style={{ padding: "2rem 0 1rem" }}>
        <h1 style={{ fontSize: "2.4rem", margin: 0 }}>biggym</h1>
        <p className="muted" style={{ fontSize: "1.1rem" }}>
          Manage your gym&apos;s clients, workout programs and memberships — in
          one place.
        </p>
      </section>

      <section
        style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr", maxWidth: 720 }}
      >
        <div>
          <h2>What you get</h2>
          <ul>
            <li>Client records, onboarding status and history</li>
            <li>Workout program builder with exercise library</li>
            <li>Staff roles: admin, reception, trainers</li>
            <li>
              Your own branded app at <code>app.{hostName()}</code>
            </li>
          </ul>
        </div>

        <div>
          <h2>Subscribe</h2>
          <SubscribeForm />
        </div>

        <p className="muted">
          Already a customer?{" "}
          <a href={`${appBaseUrl()}/login`}>Sign in to your app →</a>
        </p>
      </section>
    </main>
  );
}

function hostName() {
  const base = process.env.BASE_DOMAIN ?? "unkredible.com";
  const name = process.env.TENANT_NAME ?? "biggym";
  return `${name}.${base}`;
}
