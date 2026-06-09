"use client";

import { useCallback, useEffect, useState } from "react";

interface Staff { id: string; fullName: string; email: string; role: string; active: boolean }
interface Client { id: string; fullName: string; email: string | null; phone: string | null; onboardingStatus: string }
interface Invite { id: string; email: string; role: string }

const STAFF_GROUPS: { role: string; label: string }[] = [
  { role: "gym_admin", label: "Admins" },
  { role: "reception", label: "Reception" },
  { role: "trainer", label: "Trainers" },
];

export default function PeopleManager() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pending, setPending] = useState<Invite[]>([]);
  const [canManageStaff, setCanManageStaff] = useState(false);
  const [loading, setLoading] = useState(true);

  // forms
  const [sEmail, setSEmail] = useState(""); const [sRole, setSRole] = useState("trainer"); const [sMsg, setSMsg] = useState("");
  const [cName, setCName] = useState(""); const [cEmail, setCEmail] = useState(""); const [cPhone, setCPhone] = useState(""); const [cMsg, setCMsg] = useState("");
  const [iEmail, setIEmail] = useState(""); const [iMsg, setIMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/people");
    if (res.ok) {
      const d = await res.json();
      setStaff(d.staff ?? []); setClients(d.clients ?? []);
      setPending(d.pendingStaff ?? []); setCanManageStaff(!!d.canManageStaff);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function inviteStaff(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setSMsg("");
    const res = await fetch("/api/staff/invite", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: sEmail, role: sRole }),
    });
    setSMsg(res.ok ? `Invite sent to ${sEmail}.` : (await res.json()).error ?? "Failed.");
    if (res.ok) { setSEmail(""); load(); }
    setBusy(false);
  }
  async function addClient(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setCMsg("");
    const res = await fetch("/api/clients", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: cName, email: cEmail, phone: cPhone }),
    });
    if (res.ok) { setCName(""); setCEmail(""); setCPhone(""); load(); }
    else setCMsg((await res.json()).error ?? "Failed.");
    setBusy(false);
  }
  async function inviteClient(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setIMsg("");
    const res = await fetch("/api/clients/invite", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: iEmail }),
    });
    setIMsg(res.ok ? `Invite sent to ${iEmail}.` : (await res.json()).error ?? "Failed.");
    if (res.ok) setIEmail("");
    setBusy(false);
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <>
      {/* ---- Staff, grouped by role ---- */}
      <div className="section">
        <div className="section-label">Staff</div>
        {STAFF_GROUPS.map((g) => {
          const rows = staff.filter((s) => s.role === g.role);
          if (rows.length === 0) return null;
          return (
            <div key={g.role} style={{ marginBottom: "0.6rem" }}>
              <p className="muted" style={{ margin: "0.5rem 0 0.3rem" }}>{g.label}</p>
              <div className="list">
                {rows.map((s) => (
                  <a className="list-row" key={s.id} href={`/staff/${s.id}`}>
                    <span className="lr-icon">{g.role === "gym_admin" ? "★" : g.role === "reception" ? "🛎" : "🏋️"}</span>
                    <span>{s.fullName}<br /><span className="muted">{s.email}</span></span>
                    <span className="lr-value">{s.role}{s.active ? "" : " · inactive"}<span className="lr-chev"> →</span></span>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
        {pending.length > 0 && (
          <p className="muted" style={{ marginTop: "0.4rem" }}>
            Pending: {pending.map((p) => `${p.email} (${p.role})`).join(", ")}
          </p>
        )}

        {canManageStaff && (
          <form onSubmit={inviteStaff} className="card">
            <strong>Invite staff</strong>
            <div className="row" style={{ marginTop: "0.6rem", gap: "0.5rem" }}>
              <input type="email" placeholder="staff@email.com" value={sEmail} onChange={(e) => setSEmail(e.target.value)} required style={{ flex: 2 }} />
              <select value={sRole} onChange={(e) => setSRole(e.target.value)}>
                <option value="trainer">Trainer</option>
                <option value="reception">Reception</option>
                <option value="gym_admin">Gym admin</option>
              </select>
              <button className="primary" disabled={busy} type="submit">Send</button>
            </div>
            {sMsg && <p className="muted" style={{ margin: "0.5rem 0 0" }}>{sMsg}</p>}
          </form>
        )}
      </div>

      {/* ---- Clients ---- */}
      <div className="section">
        <div className="section-label">Clients ({clients.length})</div>
        <div className="list">
          {clients.length === 0 && <div className="list-row"><span className="muted">No clients yet.</span></div>}
          {clients.map((c) => (
            <a className="list-row" key={c.id} href={`/clients/${c.id}`}>
              <span className="lr-icon">👤</span>
              <span>{c.fullName}<br /><span className="muted">{c.email ?? c.phone ?? "—"}</span></span>
              <span className="lr-value">{c.onboardingStatus}<span className="lr-chev"> →</span></span>
            </a>
          ))}
        </div>

        <form onSubmit={addClient} className="card">
          <strong>Add client</strong>
          <div className="row" style={{ marginTop: "0.6rem", gap: "0.5rem" }}>
            <input placeholder="Full name" value={cName} onChange={(e) => setCName(e.target.value)} required style={{ flex: 2 }} />
            <input placeholder="Email" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} style={{ flex: 2 }} />
            <input placeholder="Phone" value={cPhone} onChange={(e) => setCPhone(e.target.value)} style={{ flex: 1 }} />
            <button className="primary" disabled={busy} type="submit">Add</button>
          </div>
          {cMsg && <p style={{ color: "crimson", margin: "0.5rem 0 0" }}>{cMsg}</p>}
        </form>

        <form onSubmit={inviteClient} className="card">
          <strong>Invite client by email</strong>
          <p className="muted" style={{ margin: "0.2rem 0 0.6rem" }}>Billed only when they confirm.</p>
          <div className="row" style={{ gap: "0.5rem" }}>
            <input type="email" placeholder="client@email.com" value={iEmail} onChange={(e) => setIEmail(e.target.value)} required style={{ flex: 2 }} />
            <button disabled={busy} type="submit">Send invite</button>
          </div>
          {iMsg && <p className="muted" style={{ margin: "0.5rem 0 0" }}>{iMsg}</p>}
        </form>
      </div>
    </>
  );
}
