import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

const googleEnabled =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { check?: string; error?: string };
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const checkEmail = searchParams.check === "email";
  const credError = searchParams.error === "cred";

  return (
    <main>
      <h1>Sign in</h1>
      <p className="muted">Access your gym workspace.</p>

      {checkEmail ? (
        <p className="card">
          Check your inbox — we sent you a magic sign-in link. You can close
          this tab.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem", maxWidth: 380 }}>
          {/* Email + password */}
          <form
            className="card"
            action={async (formData) => {
              "use server";
              const email = String(formData.get("email") ?? "").trim();
              const password = String(formData.get("password") ?? "");
              try {
                await signIn("credentials", {
                  email,
                  password,
                  redirectTo: "/dashboard",
                });
              } catch (err) {
                if (err instanceof AuthError) {
                  redirect("/login?error=cred");
                }
                throw err; // re-throw the redirect Next.js uses internally
              }
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <strong>Email &amp; password</strong>
              {credError && (
                <span style={{ color: "crimson" }}>Wrong email or password.</span>
              )}
              <input name="email" type="email" placeholder="you@gym.it" required />
              <input name="password" type="password" placeholder="Password" required />
              <button className="primary" type="submit">
                Sign in
              </button>
            </div>
          </form>

          {/* Magic link */}
          <form
            className="card"
            action={async (formData) => {
              "use server";
              const email = String(formData.get("email") ?? "").trim();
              if (!email) return;
              await signIn("nodemailer", { email, redirectTo: "/dashboard" });
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <strong>Magic link</strong>
              <input name="email" type="email" placeholder="you@gym.it" required />
              <button type="submit">Email me a link</button>
            </div>
          </form>

          {/* Google */}
          {googleEnabled && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button type="submit">Continue with Google</button>
            </form>
          )}
        </div>
      )}
    </main>
  );
}
