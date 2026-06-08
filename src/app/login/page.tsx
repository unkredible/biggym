import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import LoginTabs from "./LoginTabs";

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

  if (searchParams.check === "email") {
    return (
      <main>
        <h1>Check your inbox</h1>
        <p className="card">
          We sent you a sign-in link. Open it on this device to continue — you
          can close this tab.
        </p>
      </main>
    );
  }

  const credError = searchParams.error === "cred";

  const loginPanel = (
    <>
      <form
        className="card"
        action={async (formData) => {
          "use server";
          const email = String(formData.get("email") ?? "").trim();
          const password = String(formData.get("password") ?? "");
          try {
            await signIn("credentials", { email, password, redirectTo: "/dashboard" });
          } catch (err) {
            if (err instanceof AuthError) redirect("/login?error=cred");
            throw err;
          }
        }}
      >
        {credError && <p style={{ color: "var(--err)" }}>Wrong email or password.</p>}
        <div className="field">
          <label>Email</label>
          <input name="email" type="email" placeholder="you@gym.it" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input name="password" type="password" required />
        </div>
        <div className="row" style={{ marginTop: "0.9rem" }}>
          <button className="primary" type="submit">Log in</button>
        </div>
      </form>

      {googleEnabled && (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button type="submit" style={{ width: "100%" }}>Continue with Google</button>
        </form>
      )}
    </>
  );

  const signupPanel = (
    <form
      className="card"
      action={async (formData) => {
        "use server";
        const email = String(formData.get("email") ?? "").trim();
        if (!email) return;
        await signIn("nodemailer", { email, redirectTo: "/dashboard" });
      }}
    >
      <p className="muted" style={{ marginTop: 0 }}>
        We&apos;ll email a link to confirm your address, then you set a password
        and subscribe.
      </p>
      <div className="field">
        <label>Email</label>
        <input name="email" type="email" placeholder="owner@gym.it" required />
      </div>
      <div className="row" style={{ marginTop: "0.9rem" }}>
        <button className="primary" type="submit">Email me a sign-up link</button>
      </div>
    </form>
  );

  return (
    <main>
      <h1>Welcome</h1>
      <LoginTabs login={loginPanel} signup={signupPanel} />
    </main>
  );
}
