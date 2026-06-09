"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

interface Event {
  id: string;
  title: string;
  notes: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  recurUntil: string | null;
}

interface Occurrence {
  event: Event;
  at: Date;
}

const RECUR_LABEL: Record<Event["recurrence"], string> = {
  none: "once",
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
};

const WINDOW_DAYS = 90;

/** Expand one event into its occurrences inside [from, to]. */
function expand(ev: Event, from: Date, to: Date): Date[] {
  const start = new Date(ev.startsAt);
  if (ev.recurrence === "none") {
    return start >= from && start <= to ? [start] : [];
  }
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

function dayKey(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function CalendarManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // form
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState<Event["recurrence"]>("none");
  const [recurUntil, setRecurUntil] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/events");
    if (res.ok) {
      const j = await res.json();
      setEvents(j.events ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const agenda = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + WINDOW_DAYS);

    const occ: Occurrence[] = [];
    for (const ev of events) {
      for (const at of expand(ev, from, to)) occ.push({ event: ev, at });
    }
    occ.sort((a, b) => a.at.getTime() - b.at.getTime());

    const groups: { key: string; items: Occurrence[] }[] = [];
    for (const o of occ) {
      const key = dayKey(o.at);
      const g = groups.find((x) => x.key === key);
      if (g) g.items.push(o);
      else groups.push({ key, items: [o] });
    }
    return groups;
  }, [events]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!title.trim()) return setErr("Title required.");
    if (!date) return setErr("Date required.");

    const startsAt = new Date(`${date}T${allDay ? "00:00" : startTime || "00:00"}`).toISOString();
    const endsAt =
      !allDay && endTime ? new Date(`${date}T${endTime}`).toISOString() : null;

    setBusy(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        notes: notes.trim() || null,
        startsAt,
        endsAt,
        allDay,
        recurrence,
        recurUntil: recurrence !== "none" && recurUntil ? recurUntil : null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return setErr(j.error ?? "Failed.");
    }
    setTitle("");
    setNotes("");
    setEndTime("");
    setRecurUntil("");
    setRecurrence("none");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this event (and all its repeats)?")) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="grid-2">
      <section>
        <h2>New event</h2>
        <form className="card stack" onSubmit={create}>
          <label>Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Spin class" />
          </label>
          <label>Notes
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </label>
          <label>Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="row" style={{ gap: "0.5rem", alignItems: "center" }}>
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            All day
          </label>
          {!allDay && (
            <div className="row" style={{ gap: "0.75rem" }}>
              <label style={{ flex: 1 }}>Start
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </label>
              <label style={{ flex: 1 }}>End
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </label>
            </div>
          )}
          <label>Repeat
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as Event["recurrence"])}>
              <option value="none">Doesn&apos;t repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          {recurrence !== "none" && (
            <label>Repeat until
              <input type="date" value={recurUntil} onChange={(e) => setRecurUntil(e.target.value)} />
            </label>
          )}
          {err && <p className="error">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? "Saving…" : "Add event"}</button>
        </form>
      </section>

      <section>
        <h2>Agenda · next {WINDOW_DAYS} days</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : agenda.length === 0 ? (
          <p className="muted">No upcoming events.</p>
        ) : (
          <div className="stack">
            {agenda.map((g) => (
              <div key={g.key} className="card">
                <div className="muted" style={{ fontWeight: 600, marginBottom: "0.4rem" }}>{g.key}</div>
                <div className="stack">
                  {g.items.map((o, i) => (
                    <div className="row spread" key={o.event.id + i}>
                      <div>
                        <strong>{o.event.title}</strong>{" "}
                        <span className="muted">
                          {o.event.allDay
                            ? "all day"
                            : o.at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          {o.event.recurrence !== "none" && ` · ${RECUR_LABEL[o.event.recurrence]}`}
                        </span>
                        {o.event.notes && <div className="muted">{o.event.notes}</div>}
                      </div>
                      <button className="btn ghost" onClick={() => remove(o.event.id)} title="Delete">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
