import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentClient, currentContext, isStaffRole, listUserGyms } from "@/lib/gym";
import GymSwitcher from "./GymSwitcher";

export const dynamic = "force-dynamic";

const REMIND_MS = 8 * 60 * 60 * 1000; // notify 8h before a booked event

/** A client's booked events starting within the next 8 hours. */
async function upcomingReminders(clientId: string) {
  const bookings = await prisma.eventBooking.findMany({
    where: { clientId },
    include: { event: { include: { exceptions: true, location: { select: { name: true } } } } },
  });
  const now = Date.now();
  const out: { title: string; when: Date; location: string | null }[] = [];
  for (const bk of bookings) {
    const ev = bk.event;
    const ex = ev.exceptions.find(
      (e) => new Date(e.originalDate).toISOString() === new Date(bk.occurrenceDate).toISOString(),
    );
    if (ex?.canceled) continue;
    const when = ex?.startsAt ? new Date(ex.startsAt) : new Date(bk.occurrenceDate);
    const diff = when.getTime() - now;
    if (diff > 0 && diff <= REMIND_MS) {
      out.push({
        title: ex?.title ?? ev.title,
        when,
        location: ex?.locationText ?? ev.location?.name ?? ev.locationText ?? null,
      });
    }
  }
  return out.sort((a, b) => a.when.getTime() - b.when.getTime());
}

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

  let reminders: { title: string; when: Date; location: string | null }[] = [];
  if (ctx.role === "client") {
    const client = await currentClient();
    if (client) reminders = await upcomingReminders(client.id);
  }

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

      {reminders.length > 0 && (
        <div className="list">
          {reminders.map((r, i) => (
            <div className="list-row" key={i}>
              <span className="lr-icon">⏰</span>
              <span>
                <strong>Starting soon: {r.title}</strong>
                <br />
                <span className="muted">
                  {r.when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {r.when.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                  {r.location ? ` · ${r.location}` : ""}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

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

      {ctx.role === "client" && (
        <div className="list">
          <a className="list-row" href="/my/calendar">
            <span className="lr-icon">📅</span>
            <span>Calendar <span className="muted">— classes &amp; events</span></span>
            <span className="lr-value lr-chev">→</span>
          </a>
          <a className="list-row" href="/my/workouts">
            <span className="lr-icon">🏋️</span>
            <span>My workouts <span className="muted">— cards &amp; trainer</span></span>
            <span className="lr-value lr-chev">→</span>
          </a>
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
