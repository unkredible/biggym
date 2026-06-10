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
import {
  IconFlame, IconSteps, IconClock, IconCalendar, IconArrowRight,
} from "@/components/icons";

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
    const booked = await clientUpcomingBookings(client.id);
    const next = booked[0] ?? null;
    const rest = booked.slice(1, 6);

    const hour = Number(
      new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Rome" }),
    );
    const hello = hour < 12 ? "Buongiorno," : hour < 18 ? "Buon pomeriggio," : "Buonasera,";

    const R = 33;
    const C = 2 * Math.PI * R;
    const pct = 0; // daily progress — wired to real data later

    return (
      <main>
        <p className="greet-small">{hello}</p>
        <h1 className="greet">{first}! 👋</h1>
        <p className="muted" style={{ marginTop: 0 }}>Forza, conquistiamo i tuoi obiettivi oggi.</p>

        <div className="hero-card">
          <div>
            <p className="hl">Progresso giornaliero</p>
            <div className="hv">—%</div>
          </div>
          <svg className="ring" viewBox="0 0 80 80" width="78" height="78" aria-hidden>
            <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="9" />
            <circle
              cx="40" cy="40" r={R} fill="none"
              stroke="var(--lime)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={`${C * pct} ${C}`}
              transform="rotate(-90 40 40)"
            />
            {/* dumbbell glyph, white stroke, centred */}
            <g
              transform="translate(23.2 23.2) scale(1.4)"
              stroke="#fff" strokeWidth="1.8" fill="none"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M8.5 12h7" />
              <rect x="4.5" y="8.5" width="3" height="7" rx="1" />
              <rect x="16.5" y="8.5" width="3" height="7" rx="1" />
              <path d="M2.5 10.5v3M21.5 10.5v3" />
            </g>
          </svg>
        </div>

        <div className="stat-tiles">
          <div className="tile">
            <span className="ic coral"><IconFlame width={18} height={18} /></span>
            <div className="v">—</div>
            <div className="lb">Calorie</div>
            <div className="sub">kcal oggi</div>
          </div>
          <div className="tile">
            <span className="ic blue"><IconSteps width={18} height={18} /></span>
            <div className="v">—</div>
            <div className="lb">Passi</div>
            <div className="sub">/10.000</div>
          </div>
          <div className="tile">
            <span className="ic cyan"><IconClock width={18} height={18} /></span>
            <div className="v">—</div>
            <div className="lb">Attività</div>
            <div className="sub">/90 min</div>
          </div>
        </div>

        <div className="section-h">Prossimo evento</div>
        {next ? (
          <div className="next-card">
            <div style={{ minWidth: 0 }}>
              <div className="nt">{next.title}</div>
              {next.location && <div className="muted">{next.location}</div>}
              <div className="chiprow">
                <span className="chip"><IconClock width={13} height={13} /> {next.when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="chip"><IconCalendar width={13} height={13} /> {next.when.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</span>
                {next.soon && <span className="chip" style={{ color: "var(--coral)" }}><IconClock width={13} height={13} /> a breve</span>}
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/illustration-workout-push.webp" alt="" />
          </div>
        ) : (
          <div className="next-card">
            <div>
              <div className="nt">Nessun evento</div>
              <div className="muted">Iscriviti a una classe dal calendario.</div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/illustration-workout-push.webp" alt="" style={{ opacity: 0.5 }} />
          </div>
        )}

        {rest.length > 0 && (
          <>
            <div className="section-h">I tuoi eventi</div>
            <div className="list">
              {rest.map((b) => (
                <div className="list-row" key={b.id}>
                  <span className="lr-icon">{b.soon ? <IconClock width={16} height={16} /> : <IconCalendar width={16} height={16} />}</span>
                  <span>
                    <strong>{b.title}</strong>
                    <br />
                    <span className="muted">
                      {timeLabel(b.when)}
                      {b.location ? ` · ${b.location}` : ""}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <a href={next ? "/my/calendar" : "/my/workouts"} style={{ display: "block" }}>
          <button className="cta-big">
            <span>{next ? "Vai al calendario" : "Inizia allenamento"}</span>
            <span className="arr"><IconArrowRight width={18} height={18} /></span>
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
