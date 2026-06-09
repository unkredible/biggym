"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

interface Loc { id: string; name: string }
interface Plan { id: string; name: string }

interface Exception {
  id: string;
  originalDate: string;
  canceled: boolean;
  title: string | null;
  notes: string | null;
  startsAt: string | null;
  endsAt: string | null;
  capacity: number | null;
  locationId: string | null;
  locationText: string | null;
}

interface EventRow {
  id: string;
  title: string;
  notes: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  recurUntil: string | null;
  capacity: number | null;
  audience: "all" | "plan";
  planId: string | null;
  locationId: string | null;
  locationText: string | null;
  location: { name: string } | null;
  plan: { name: string } | null;
  exceptions: Exception[];
}

interface Occ {
  event: EventRow;
  baseISO: string;
  at: Date;
  canceled: boolean;
  overridden: boolean;
  title: string;
  notes: string | null;
  capacity: number | null;
  locationName: string | null;
}

const RECUR_LABEL: Record<EventRow["recurrence"], string> = {
  none: "once", daily: "daily", weekly: "weekly", monthly: "monthly",
};
const WINDOW_DAYS = 90;
type Mode = "create" | "series" | "occurrence";

const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const combine = (date: string, time: string) => new Date(`${date}T${time || "00:00"}`).toISOString();

/** Base occurrence starts for an event within [from, to] (before overrides). */
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

function dayKey(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function CalendarManager({ locations, plans }: { locations: Loc[]; plans: Plan[] }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // mode + edit targets
  const [mode, setMode] = useState<Mode>("create");
  const [editId, setEditId] = useState("");
  const [editDate, setEditDate] = useState(""); // occurrence baseISO

  // form fields
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState<EventRow["recurrence"]>("none");
  const [recurUntil, setRecurUntil] = useState("");
  const [capacity, setCapacity] = useState("");
  const [audience, setAudience] = useState<"all" | "plan">("all");
  const [planId, setPlanId] = useState("");
  const [locMode, setLocMode] = useState<"none" | "existing" | "other">("none");
  const [locationId, setLocationId] = useState("");
  const [locationText, setLocationText] = useState("");

  const locName = (id: string | null) => locations.find((l) => l.id === id)?.name ?? null;

  async function load() {
    setLoading(true);
    const res = await fetch("/api/events");
    if (res.ok) setEvents((await res.json()).events ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const agenda = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + WINDOW_DAYS);

    const occ: Occ[] = [];
    for (const ev of events) {
      const exByISO = new Map(ev.exceptions.map((e) => [new Date(e.originalDate).toISOString(), e]));
      for (const b of baseDates(ev, from, to)) {
        const ex = exByISO.get(b.toISOString());
        const at = ex?.startsAt ? new Date(ex.startsAt) : b;
        occ.push({
          event: ev,
          baseISO: b.toISOString(),
          at,
          canceled: !!ex?.canceled,
          overridden: !!ex && !ex.canceled,
          title: ex?.title ?? ev.title,
          notes: ex?.notes ?? ev.notes,
          capacity: ex?.capacity ?? ev.capacity,
          locationName: ex
            ? ex.locationId ? locName(ex.locationId) : ex.locationText ?? null
            : ev.location?.name ?? ev.locationText ?? null,
        });
      }
    }
    occ.sort((a, b) => a.at.getTime() - b.at.getTime());

    const groups: { key: string; items: Occ[] }[] = [];
    for (const o of occ) {
      const key = dayKey(o.at);
      const g = groups.find((x) => x.key === key);
      if (g) g.items.push(o);
      else groups.push({ key, items: [o] });
    }
    return groups;
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetForm() {
    setMode("create"); setEditId(""); setEditDate("");
    setTitle(""); setNotes(""); setDate(""); setStartTime("18:00"); setEndTime("");
    setAllDay(false); setRecurrence("none"); setRecurUntil("");
    setCapacity(""); setAudience("all"); setPlanId("");
    setLocMode("none"); setLocationId(""); setLocationText("");
    setErr("");
  }

  function fillLocationFrom(lid: string | null, ltext: string | null) {
    if (lid) { setLocMode("existing"); setLocationId(lid); setLocationText(""); }
    else if (ltext) { setLocMode("other"); setLocationText(ltext); setLocationId(""); }
    else { setLocMode("none"); setLocationId(""); setLocationText(""); }
  }

  function editSeries(ev: EventRow) {
    const s = new Date(ev.startsAt);
    setMode("series"); setEditId(ev.id); setEditDate("");
    setTitle(ev.title); setNotes(ev.notes ?? "");
    setDate(toDateStr(s)); setStartTime(toTimeStr(s));
    setEndTime(ev.endsAt ? toTimeStr(new Date(ev.endsAt)) : "");
    setAllDay(ev.allDay); setRecurrence(ev.recurrence);
    setRecurUntil(ev.recurUntil ? toDateStr(new Date(ev.recurUntil)) : "");
    setCapacity(ev.capacity != null ? String(ev.capacity) : "");
    setAudience(ev.audience); setPlanId(ev.planId ?? "");
    fillLocationFrom(ev.locationId, ev.locationText);
    setErr("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function editOccurrence(o: Occ) {
    setMode("occurrence"); setEditId(o.event.id); setEditDate(o.baseISO);
    setTitle(o.title); setNotes(o.notes ?? "");
    setDate(toDateStr(o.at)); setStartTime(toTimeStr(o.at));
    setEndTime(""); setAllDay(o.event.allDay);
    setCapacity(o.capacity != null ? String(o.capacity) : "");
    // location: derive from effective occ
    const lid = locations.find((l) => l.name === o.locationName)?.id ?? null;
    fillLocationFrom(lid, lid ? null : o.locationName);
    setErr("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function locationPayload() {
    if (locMode === "existing") return { locationId: locationId || null, locationText: null };
    if (locMode === "other") return { locationId: null, locationText: locationText.trim() || null };
    return { locationId: null, locationText: null };
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!title.trim()) return setErr("Title required.");
    if (!date) return setErr("Date required.");
    if (audience === "plan" && !planId) return setErr("Pick a plan.");

    const startsAt = combine(date, allDay ? "00:00" : startTime || "00:00");
    const endsAt = !allDay && endTime ? combine(date, endTime) : null;
    const loc = locationPayload();

    setBusy(true);
    let res: Response;
    if (mode === "occurrence") {
      res = await fetch(`/api/events/${editId}/exceptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalDate: editDate,
          title: title.trim(), notes: notes.trim() || null,
          startsAt, endsAt, capacity: capacity || null, ...loc,
        }),
      });
    } else {
      const body = {
        title: title.trim(), notes: notes.trim() || null,
        startsAt, endsAt, allDay, recurrence,
        recurUntil: recurrence !== "none" && recurUntil ? recurUntil : null,
        capacity: capacity || null, audience, planId: audience === "plan" ? planId : null,
        ...loc,
      };
      res = mode === "series"
        ? await fetch(`/api/events/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setBusy(false);
    if (!res.ok) return setErr((await res.json().catch(() => ({}))).error ?? "Failed.");
    resetForm();
    load();
  }

  async function cancelOcc(eventId: string, baseISO: string) {
    if (!confirm("Cancel just this date?")) return;
    await fetch(`/api/events/${eventId}/exceptions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalDate: baseISO, canceled: true }),
    });
    load();
  }
  async function restoreOcc(eventId: string, baseISO: string) {
    await fetch(`/api/events/${eventId}/exceptions?date=${encodeURIComponent(baseISO)}`, { method: "DELETE" });
    load();
  }
  async function removeSeries(eventId: string) {
    if (!confirm("Delete this event and all its repeats?")) return;
    await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (editId === eventId) resetForm();
    load();
  }

  const occurrenceMode = mode === "occurrence";
  const heading = mode === "create" ? "New event" : mode === "series" ? "Edit series" : "Edit this occurrence";

  return (
    <div className="grid-2">
      <section>
        <div className="row spread">
          <h2>{heading}</h2>
          {mode !== "create" && <button className="ghost" onClick={resetForm}>+ new</button>}
        </div>
        <form className="card stack" onSubmit={submit} ref={formRef}>
          <label>Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Spin class" />
          </label>
          <label>Notes
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </label>
          <label>Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="row">
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

          {/* Location */}
          <label>Location
            <select value={locMode} onChange={(e) => setLocMode(e.target.value as "none" | "existing" | "other")}>
              <option value="none">— none —</option>
              {locations.length > 0 && <option value="existing">A gym location</option>}
              <option value="other">Other (type it)</option>
            </select>
          </label>
          {locMode === "existing" && (
            <label>Which location
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                <option value="">Pick…</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
          )}
          {locMode === "other" && (
            <label>Address / place
              <input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="Via Roma 1, Park, …" />
            </label>
          )}

          <label>Max participants
            <input type="number" min="1" step="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Unlimited" />
          </label>

          {!occurrenceMode && (
            <>
              <label>Open to
                <select value={audience} onChange={(e) => setAudience(e.target.value as "all" | "plan")}>
                  <option value="all">All clients</option>
                  <option value="plan">A specific plan</option>
                </select>
              </label>
              {audience === "plan" && (
                <label>Plan
                  <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
                    <option value="">Pick a plan…</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              )}
              <label>Repeat
                <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as EventRow["recurrence"])}>
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
            </>
          )}
          {occurrenceMode && <p className="muted">Editing only this date. Audience &amp; repeat are set on the series.</p>}

          {err && <p className="error">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? "Saving…" : mode === "create" ? "Add event" : "Save"}</button>
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
                  {g.items.map((o, i) => {
                    const ev = o.event;
                    const recurring = ev.recurrence !== "none";
                    return (
                      <div className="row spread" key={o.event.id + i} style={o.canceled ? { opacity: 0.5 } : undefined}>
                        <div>
                          <strong style={o.canceled ? { textDecoration: "line-through" } : undefined}>{o.title}</strong>{" "}
                          <span className="muted">
                            {ev.allDay ? "all day" : o.at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            {recurring && ` · ${RECUR_LABEL[ev.recurrence]}`}
                            {o.overridden && " · edited"}
                          </span>
                          <div className="muted">
                            {o.locationName && <>📍 {o.locationName} </>}
                            {o.capacity != null && <>· max {o.capacity} </>}
                            {ev.audience === "plan" && <>· {ev.plan?.name ?? "plan"} only</>}
                          </div>
                          {o.notes && <div className="muted">{o.notes}</div>}
                        </div>
                        <div className="row" style={{ gap: "0.2rem" }}>
                          {o.canceled ? (
                            <button className="ghost" onClick={() => restoreOcc(ev.id, o.baseISO)}>restore</button>
                          ) : recurring ? (
                            <>
                              <button className="ghost" onClick={() => editOccurrence(o)} title="Edit this date">this</button>
                              <button className="ghost" onClick={() => editSeries(ev)} title="Edit whole series">series</button>
                              {o.overridden && <button className="ghost" onClick={() => restoreOcc(ev.id, o.baseISO)} title="Undo this date's changes">undo</button>}
                              <button className="ghost" onClick={() => cancelOcc(ev.id, o.baseISO)} title="Cancel this date">✕</button>
                            </>
                          ) : (
                            <>
                              <button className="ghost" onClick={() => editSeries(ev)}>edit</button>
                              <button className="danger" style={{ padding: "0.2rem 0.6rem" }} onClick={() => removeSeries(ev.id)}>✕</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
