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
    include: {
      gym: { include: { locations: { where: { active: true }, orderBy: { createdAt: "asc" } } } },
    },
  });

  // A signed-in user with no gym yet → start the gym sign-up flow.
  if (!membership) redirect("/onboarding");

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
          <div
            className="card accent"
            style={
              membership.gym.bannerUrl
                ? {
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${membership.gym.bannerUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    color: "#fff",
                    minHeight: 150,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }
                : undefined
            }
          >
            <p className="muted" style={{ margin: 0 }}>Your gym</p>
            <h2 style={{ margin: "0.15rem 0 0.3rem", fontSize: "1.8rem" }}>
              {membership.gym.appName ?? membership.gym.name}
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {membership.role} · {membership.gym.subscriptionStatus}
            </p>
          </div>

          {membership.gym.locations.length > 0 && (
            <div className="list">
              {membership.gym.locations.map((l) => (
                <div className="list-row" key={l.id}>
                  <span className="lr-icon">📍</span>
                  <span>
                    <strong>{l.name}</strong>
                    <br />
                    <span className="muted">
                      {l.addressLine}
                      {l.city ? `, ${l.city}` : ""}
                    </span>
                  </span>
                  {l.phone && <span className="lr-value">{l.phone}</span>}
                </div>
              ))}
            </div>
          )}

          {isStaffRole(membership.role) && (
            <div className="card">
              <h3>Manage</h3>
              <div className="row" style={{ gap: "1.2rem" }}>
                <a href="/clients">Clients →</a>
                {membership.role === "gym_admin" && <a href="/staff">Staff →</a>}
              </div>
            </div>
          )}

          {membership.role === "client" && (
            <div className="card">
              <h3>Training</h3>
              <a href="/my/workouts">My workouts →</a>
            </div>
          )}
        </>
      )}

      <div className="list" style={{ marginTop: "1.2rem" }}>
        <a className="list-row" href="/settings">
          <span className="lr-icon">⚙</span>
          <span>Settings</span>
          <span className="lr-value lr-chev">→</span>
        </a>
      </div>
    </main>
  );
}
