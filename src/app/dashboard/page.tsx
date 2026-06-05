import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { isStaffRole } from "@/lib/gym";
import { isSuperAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
    include: { gym: true },
  });

  return (
    <main>
      <div className="row spread">
        <h1>Dashboard</h1>
        <div className="row">
          {isSuperAdmin(session.user.role) && <a href="/admin">Platform admin</a>}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit">Sign out</button>
          </form>
        </div>
      </div>

      {!membership ? (
        <div className="card">
          <p>
            You&apos;re signed in as <code>{session.user.email}</code> but not yet
            linked to a gym. If you just subscribed, give it a minute and
            refresh; otherwise ask your gym admin for an invite.
          </p>
        </div>
      ) : (
        <>
          <div className="card">
            <p className="muted">Gym</p>
            <h2 style={{ margin: "0.2rem 0" }}>{membership.gym.name}</h2>
            <p className="muted">
              role: <code>{membership.role}</code> · plan:{" "}
              <code>{membership.gym.subscriptionStatus}</code>
            </p>
          </div>

          {isStaffRole(membership.role) && (
            <div className="card">
              <h3>Manage</h3>
              <div className="row" style={{ gap: "1rem" }}>
                <a href="/clients">Clients →</a>
                {membership.role === "gym_admin" && <a href="/staff">Staff →</a>}
                {membership.role === "gym_admin" && (
                  <a href="/settings">Settings →</a>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="card">
        <a href="/account">Account &amp; password →</a>
      </div>
    </main>
  );
}
