"use client";

import { useCallback, useEffect, useState } from "react";

interface Loc {
  id: string;
  name: string;
  addressLine: string;
  city: string | null;
  phone: string | null;
}

export default function LocationsManager() {
  const [locs, setLocs] = useState<Loc[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/gym/locations");
    if (res.ok) setLocs((await res.json()).locations ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/gym/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, addressLine: address, city, phone }),
    });
    if (res.ok) {
      setName(""); setAddress(""); setCity(""); setPhone("");
      load();
    } else {
      setMsg((await res.json()).error ?? "Failed.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("Remove this location?")) return;
    await fetch(`/api/gym/locations/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      {locs.length > 0 && (
        <div className="list" style={{ marginBottom: "0.85rem" }}>
          {locs.map((l) => (
            <div className="list-row" key={l.id}>
              <span className="lr-icon">📍</span>
              <span>
                <strong>{l.name}</strong>
                <br />
                <span className="muted">
                  {l.addressLine}
                  {l.city ? `, ${l.city}` : ""}
                  {l.phone ? ` · ${l.phone}` : ""}
                </span>
              </span>
              <button className="danger" style={{ marginLeft: "auto" }} onClick={() => remove(l.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} className="card">
        <strong>Add location</strong>
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Downtown" required />
        </div>
        <div className="field">
          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Via Roma 1" required />
        </div>
        <div className="row" style={{ gap: "0.5rem", marginTop: "0.6rem" }}>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={{ flex: 1 }} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={{ flex: 1 }} />
        </div>
        <div className="row" style={{ marginTop: "0.8rem" }}>
          <button className="primary" disabled={busy} type="submit">Add</button>
          {msg && <span className="muted">{msg}</span>}
        </div>
      </form>
    </>
  );
}
