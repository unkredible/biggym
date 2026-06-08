import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole, listUserGyms } from "@/lib/gym";
import { appBaseUrl } from "@/lib/host";
import GymSwitcher from "./GymSwitcher";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId) redirect("/onboarding"); // no gym yet → sign up

  const [gym, gyms] = await Promise.all([
    prisma.gym.findUnique({
      where: { id: ctx.gymId },
      include: { locations: { where: { active: true }, orderBy: { createdAt: "asc" } } },
    }),
    listUserGyms(ctx.userId),
  ]);
  if (!gym) redirect("/onboarding");

  const isAdmin = ctx.role === "gym_admin";

  return (
    <main>
      <div className="row spread">
        <h1>Dashboard</h1>
        <div className="row">
          {gyms.length > 1 && <GymSwitcher gyms={gyms} activeId={ctx.gymId} />}
          {ctx.isSuper && <a href="/admin">Platform admin</a>}
        </div>
      </div>

      <div
        className="card accent"
        style={
          gym.bannerUrl
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${gym.bannerUrl})`,
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
          {gym.appName ?? gym.name}
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          {ctx.role} · {gym.subscriptionStatus}
        </p>
      </div>

      {gym.locations.length > 0 && (
        <div className="list">
          {gym.locations.map((l) => (
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

      {isStaffRole(ctx.role) && (
        <div className="card">
          <h3>Manage</h3>
          <div className="row" style={{ gap: "1.2rem" }}>
            <a href="/clients">Clients →</a>
            {isAdmin && <a href="/staff">Staff →</a>}
          </div>
        </div>
      )}

      {ctx.role === "client" && (
        <div className="card">
          <h3>Training</h3>
          <a href="/my/workouts">My workouts →</a>
        </div>
      )}

      <div className="list" style={{ marginTop: "1.2rem" }}>
        <a className="list-row" href="/settings">
          <span className="lr-icon">⚙</span>
          <span>Settings</span>
          <span className="lr-value lr-chev">→</span>
        </a>
        <a className="list-row" href={`${appBaseUrl()}/onboarding`}>
          <span className="lr-icon">＋</span>
          <span>Create another gym</span>
          <span className="lr-value lr-chev">→</span>
        </a>
      </div>
    </main>
  );
}
