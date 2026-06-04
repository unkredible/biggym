"use client";

import { useCallback, useEffect, useState } from "react";

interface Client {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  onboardingStatus: string;
  createdAt: string;
}

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/clients");
    if (res.ok) setClients((await res.json()).clients ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, phone }),
    });
    const data = await res.json();
    if (res.ok) {
      setFullName("");
      setEmail("");
      setPhone("");
      load();
    } else {
      setError(data.error ?? "Failed.");
    }
    setBusy(false);
  }

  return (
    <>
      <form onSubmit={create} className="card">
        <strong>New client</strong>
        <div className="row" style={{ marginTop: "0.6rem", gap: "0.5rem" }}>
          <input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ flex: 2 }}
          />
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: 2 }}
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="primary" disabled={busy} type="submit">
            Add
          </button>
        </div>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : clients.length === 0 ? (
        <p className="muted">No clients yet.</p>
      ) : (
        clients.map((c) => (
          <div className="card" key={c.id}>
            <div className="row spread">
              <strong>{c.fullName}</strong>
              <span className="badge">{c.onboardingStatus}</span>
            </div>
            <p className="muted" style={{ margin: "0.3rem 0 0" }}>
              {c.email ?? "—"} · {c.phone ?? "—"}
            </p>
          </div>
        ))
      )}
    </>
  );
}
