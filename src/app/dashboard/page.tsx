import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  currentClient,
  clientUpcomingBookings,
  currentContext,
  isStaffRole,
  listUserGyms,
} from "@/lib/gym";
import GymSwitcher from "./GymSwitcher";

export const dynamic = "force-dynamic";

function timeLabel(d: Date) {
  return `${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

export default async function DashboardPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId) redirect("/onboarding"); // no gym yet → sign up

  // -------------------------------------------------------------- client app
  if (ctx.role === "client") {
    const client = await currentClient();
    if (!client) redirect("/onboarding");
    const first = (client.fullName || "").trim().split(/\s+/)[0] || "atleta";
    const booked = (await clientUpcomingBookings(client.id)).slice(0, 6);

    return (
      <main>
        <h1 className="greet">Ciao {first}! 👋</h1>
        <p className="muted">Forza, conquistiamo i tuoi obiettivi oggi 💪</p>

        <div className="card accent">
          <p className="muted" style={{ margin: 0 }}>Progresso giornaliero</p>
          <div className="row spread" style={{ marginTop: "0.2rem" }}>
            <span style={{ fontSize: "2.1rem", fontWeight: 800, lineHeight: 1 }}>—</span>
            <span style={{ fontSize: "1.7rem" }}>🏋️</span>
          </div>
          <p className="muted" style={{ margin: "0.3rem 0 0" }}>Presto disponibile</p>
        </div>

        <div className="stat-tiles">
          <div className="tile"><div className="ic">🔥</div><div className="v">—</div><div className="lb">Calorie</div></div>
          <div className="tile"><div className="ic">👟</div><div className="v">—</div><div className="lb">Passi</div></div>
          <div className="tile"><div className="ic">⏱️</div><div className="v">—</div><div className="lb">Tempo attivo</div></div>
        </div>

        <h2>I tuoi eventi</h2>
        {booked.length === 0 ? (
          <p className="muted">
            Non sei iscritto a nessun evento.{" "}
            <a href="/my/calendar">Sfoglia il calendario →</a>
          </p>
        ) : (
          <div className="list">
            {booked.map((b) => (
              <div className="list-row" key={b.id}>
                <span className="lr-icon">{b.soon ? "⏰" : "📅"}</span>
                <span>
                  <strong>{b.title}</strong>
                  <br />
                  <span className="muted">
                    {timeLabel(b.when)}
                    {b.location ? ` · ${b.location}` : ""}
                  </span>
                </span>
                {b.soon && <span className="lr-value" style={{ color: "var(--coral)" }}>a breve</span>}
              </div>
            ))}
          </div>
        )}

        <a href="/my/workouts">
          <button className="btn" style={{ width: "100%", marginTop: "1.2rem", padding: "0.95rem" }}>
            Inizia allenamento →
          </button>
        </a>
      </main>
    );
  }

  // --------------------------------------------------------------- staff app
  const [gym, gyms] = await Promise.all([
    prisma.gym.findUnique({
      where: { id: ctx.gymId },
      include: { locations: { where: { active: true }, orderBy: { createdAt: "asc" } } },
    }),
    listUserGyms(ctx.userId),
  ]);
  if (!gym) redirect("/onboarding");

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
        <div className="list">
          <a className="list-row" href="/people">
            <span className="lr-icon">👥</span>
            <span>People <span className="muted">— staff &amp; clients</span></span>
            <span className="lr-value lr-chev">→</span>
          </a>
          {(ctx.isSuper || ctx.role === "gym_admin") && (
            <>
              <a className="list-row" href="/calendar">
                <span className="lr-icon">📅</span>
                <span>Calendar <span className="muted">— events &amp; classes</span></span>
                <span className="lr-value lr-chev">→</span>
              </a>
              <a className="list-row" href="/plans">
                <span className="lr-icon">🏷️</span>
                <span>Plans <span className="muted">— subscription tiers</span></span>
                <span className="lr-value lr-chev">→</span>
              </a>
            </>
          )}
        </div>
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
