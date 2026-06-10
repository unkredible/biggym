"use client";

import { useEffect, useMemo, useState } from "react";

interface Exception {
  originalDate: string; canceled: boolean; title: string | null; notes: string | null;
  startsAt: string | null; capacity: number | null; locationText: string | null;
}
interface EventRow {
  id: string; title: string; notes: string | null; startsAt: string; endsAt: string | null;
  allDay: boolean; recurrence: "none" | "daily" | "weekly" | "monthly"; recurUntil: string | null;
  capacity: number | null; audience: "all" | "plan";
  locationText: string | null; location: { name: string } | null;
  plans: { id: string; name: string }[];
  exceptions: Exception[];
}
interface Occ {
  event: EventRow; baseISO: string; at: Date; canceled: boolean;
  title: string; notes: string | null; capacity: number | null; locationName: string | null;
}

type View = "list" | "week" | "month";
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function baseDates(ev: EventRow, from: Date, to: Date): Date[] {
  const start = new Date(ev.startsAt);
  if (ev.recurrence === "none") return start >= from && start <= to ? [start] : [];
  const until = ev.recurUntil ? new Date(ev.recurUntil) : to;
  const hardEnd = until < to ? until : to;
  const out: Date[] = [];
  const cur = new Date(start);
  let guard = 0;
  while (cur <= hardEnd && guard < 800) {
    if (cur >= from) out.push(new Date(cur));
    if (ev.recurrence === "daily") cur.setDate(cur.getDate() + 1);
    else if (ev.recurrence === "weekly") cur.setDate(cur.getDate() + 7);
    else cur.setMonth(cur.getMonth() + 1);
    guard++;
  }
  return out;
}
const k = (eventId: string, baseISO: string) => `${eventId}|${baseISO}`;
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
function startOfWeek(d: Date) { const x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const hhmm = (d: Date) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export default function MyCalendar() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [view, setView] = useState<View>("list");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selKey, setSelKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/my/events");
    if (res.ok) {
      const j = await res.json();
      setEvents(j.events ?? []);
      setPlanId(j.planId ?? null);
      setCounts(new Map((j.counts ?? []).map((c: { eventId: string; occurrenceDate: string; count: number }) =>
        [k(c.eventId, new Date(c.occurrenceDate).toISOString()), c.count] as [string, number])));
      setMine(new Set((j.mine ?? []).map((m: { eventId: string; occurrenceDate: string }) =>
        k(m.eventId, new Date(m.occurrenceDate).toISOString()))));
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const range = useMemo(() => {
    if (view === "week") { const f = startOfWeek(cursor); const t = new Date(f); t.setDate(t.getDate() + 7); return [f, t] as const; }
    if (view === "month") {
      const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const f = startOfWeek(first); const t = new Date(f); t.setDate(t.getDate() + 42); return [f, t] as const;
    }
    const f = startOfDay(new Date()); const t = new Date(f); t.setDate(t.getDate() + 90); return [f, t] as const;
  }, [view, cursor]);

  const occs = useMemo(() => {
    const [from, to] = range;
    const out: Occ[] = [];
    for (const ev of events) {
      const exMap = new Map(ev.exceptions.map((e) => [new Date(e.originalDate).toISOString(), e]));
      for (const b of baseDates(ev, from, to)) {
        const ex = exMap.get(b.toISOString());
        if (ex?.canceled) continue; // cancelled dates are hidden, not struck
        out.push({
          event: ev, baseISO: b.toISOString(),
          at: ex?.startsAt ? new Date(ex.startsAt) : b,
          canceled: !!ex?.canceled,
          title: ex?.title ?? ev.title,
          notes: ex?.notes ?? ev.notes,
          capacity: ex?.capacity ?? ev.capacity,
          locationName: ex?.locationText ?? ev.location?.name ?? ev.locationText ?? null,
        });
      }
    }
    out.sort((a, b) => a.at.getTime() - b.at.getTime());
    return out;
  }, [events, range]);

  async function book(o: Occ) {
    setMsg("");
    const res = await fetch("/api/my/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: o.event.id, occurrenceDate: o.baseISO }),
    });
    if (!res.ok) setMsg((await res.json().catch(() => ({}))).error ?? "Failed.");
    load();
  }
  async function cancel(o: Occ) {
    setMsg("");
    await fetch("/api/my/bookings", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: o.event.id, occurrenceDate: o.baseISO }),
    });
    load();
  }

  function OccRow({ o }: { o: Occ }) {
    const key = k(o.event.id, o.baseISO);
    const booked = mine.has(key);
    const count = counts.get(key) ?? 0;
    const canBook = o.event.audience === "all" || (planId != null && o.event.plans.some((p) => p.id === planId));
    const full = o.capacity != null && count >= o.capacity && !booked;

    return (
      <div className="row spread" style={o.canceled ? { opacity: 0.5 } : undefined}>
        <div>
          <strong style={o.canceled ? { textDecoration: "line-through" } : undefined}>{o.title}</strong>{" "}
          <span className="muted">{o.event.allDay ? "all day" : hhmm(o.at)}</span>
          <div className="muted">
            {o.locationName && <>📍 {o.locationName} </>}
            {o.capacity != null ? <>· {count}/{o.capacity} </> : count > 0 ? <>· {count} going </> : null}
            {o.event.audience === "plan" && <>· {o.event.plans.map((p) => p.name).join(", ") || "plan"} only</>}
          </div>
          {o.notes && <div className="muted">{o.notes}</div>}
        </div>
        <div>
          {o.canceled ? (
            <span className="muted">annullato</span>
          ) : booked ? (
            <button className="ghost btn-sm" onClick={() => cancel(o)}>Annulla</button>
          ) : !canBook ? (
            <button className="btn-sm" disabled title="Non incluso nel tuo piano">Solo piano</button>
          ) : full ? (
            <button className="btn-sm" disabled>Pieno</button>
          ) : (
            <button className="primary btn-sm" onClick={() => book(o)}>Iscriviti</button>
          )}
        </div>
      </div>
    );
  }

  // ---- views -------------------------------------------------------------
  function listView() {
    if (occs.length === 0) return <p className="muted">No upcoming events.</p>;
    const groups: { key: string; items: Occ[] }[] = [];
    for (const o of occs) {
      const key = o.at.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
      const g = groups.find((x) => x.key === key);
      if (g) g.items.push(o); else groups.push({ key, items: [o] });
    }
    return (
      <div className="stack">
        {groups.map((g) => (
          <div key={g.key} className="card">
            <div className="muted" style={{ fontWeight: 600, marginBottom: "0.4rem" }}>{g.key}</div>
            <div className="stack">{g.items.map((o, i) => <OccRow key={o.baseISO + i} o={o} />)}</div>
          </div>
        ))}
      </div>
    );
  }

  function gridView(days: Date[]) {
    const today = new Date();
    const month = cursor.getMonth();
    const selected = selKey ? occs.find((o) => k(o.event.id, o.baseISO) === selKey) ?? null : null;
    return (
      <>
        <div className="cal-grid" style={{ marginBottom: 6 }}>
          {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
        </div>
        <div className="cal-grid">
          {days.map((day) => {
            const dayOccs = occs.filter((o) => sameDay(o.at, day));
            const dim = view === "month" && day.getMonth() !== month;
            return (
              <div key={day.toISOString()} className={`cal-cell${dim ? " dim" : ""}${sameDay(day, today) ? " today" : ""}`}>
                <div className="d">{day.getDate()}</div>
                {dayOccs.map((o, i) => {
                  const booked = mine.has(k(o.event.id, o.baseISO));
                  return (
                    <button
                      key={o.baseISO + i}
                      className={`cal-chip${booked ? " mine" : ""}${o.canceled ? " off" : ""}`}
                      onClick={() => setSelKey(k(o.event.id, o.baseISO))}
                      title={o.title}
                    >
                      {o.event.allDay ? "" : hhmm(o.at) + " "}{o.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        {selected && (
          <div className="card" style={{ marginTop: "0.9rem" }}>
            <div className="row spread">
              <div className="muted" style={{ fontWeight: 600 }}>
                {selected.at.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <button className="ghost" onClick={() => setSelKey(null)}>close</button>
            </div>
            <div style={{ marginTop: "0.5rem" }}><OccRow o={selected} /></div>
          </div>
        )}
      </>
    );
  }

  function weekView() {
    const f = startOfWeek(cursor);
    return gridView(Array.from({ length: 7 }, (_, i) => { const d = new Date(f); d.setDate(d.getDate() + i); return d; }));
  }
  function monthView() {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const f = startOfWeek(first);
    return gridView(Array.from({ length: 42 }, (_, i) => { const d = new Date(f); d.setDate(d.getDate() + i); return d; }));
  }

  function shift(dir: 1 | -1) {
    setSelKey(null);
    setCursor((c) => {
      const x = new Date(c);
      if (view === "week") x.setDate(x.getDate() + dir * 7);
      else if (view === "month") x.setMonth(x.getMonth() + dir);
      return x;
    });
  }
  const label =
    view === "month" ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : view === "week" ? (() => { const f = startOfWeek(cursor); const t = new Date(f); t.setDate(t.getDate() + 6);
        return `${f.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${t.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`; })()
    : "Next 90 days";

  return (
    <div>
      <div className="row spread" style={{ marginBottom: "0.8rem" }}>
        <div className="seg">
          {(["list", "week", "month"] as View[]).map((v) => (
            <button key={v} className={view === v ? "on" : ""} onClick={() => { setView(v); setSelKey(null); }}>{v}</button>
          ))}
        </div>
        <div className="row" style={{ gap: "0.4rem" }}>
          {view !== "list" && <button className="ghost" onClick={() => shift(-1)}>◀</button>}
          <strong style={{ minWidth: 120, textAlign: "center" }}>{label}</strong>
          {view !== "list" && <button className="ghost" onClick={() => shift(1)}>▶</button>}
        </div>
      </div>

      {msg && <p className="error">{msg}</p>}
      {loading ? <p className="muted">Loading…</p> : view === "list" ? listView() : view === "week" ? weekView() : monthView()}
    </div>
  );
}
