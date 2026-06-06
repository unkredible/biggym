import { notFound } from "next/navigation";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { DEV_ROLES, type DevAs } from "@/lib/dev";

export const dynamic = "force-dynamic";

/**
 * DEV-ONLY quick login. Renders only when DEV_QUICK_TOKEN is set. Each button
 * signs in instantly as a seeded demo user for that role.
 */
export default function DevLoginPage() {
  if (!process.env.DEV_QUICK_TOKEN) notFound();

  return (
    <main>
      <h1>Dev quick login</h1>
      <p className="muted">
        ⚠ Test only. Instantly sign in as a seeded demo user. Disable by
        unsetting <code>DEV_QUICK_TOKEN</code>.
      </p>

      <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
        {DEV_ROLES.map((role) => (
          <form
            key={role}
            action={async () => {
              "use server";
              try {
                await signIn("dev", {
                  as: role,
                  token: process.env.DEV_QUICK_TOKEN,
                  redirectTo: "/dashboard",
                });
              } catch (err) {
                if (err instanceof AuthError) redirect("/dev?error=1");
                throw err;
              }
            }}
          >
            <button className={role === "superadmin" ? "primary" : ""} type="submit">
              {label(role)}
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}

function label(role: DevAs): string {
  switch (role) {
    case "superadmin": return "Superadmin";
    case "palestra": return "Palestra (admin)";
    case "personal1": return "Personal 1";
    case "personal2": return "Personal 2";
    case "client1": return "Client 1";
    case "client2": return "Client 2";
    case "client3": return "Client 3";
  }
}
