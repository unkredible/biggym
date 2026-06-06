"use client";

import { useCallback, useEffect, useState } from "react";

interface Loc {
  id: string;
  name: string;
  addressLine: string;
  city: string | null;
  phone: string | null;
}

function LocationRow({ loc, onChanged }: { loc: Loc; onChanged: () => void }) {
  const [name, setName] = useState(loc.name);
  const [address, setAddress] = useState(loc.addressLine);
  const [city, setCity] = useState(loc.city ?? "");
  const [phone, setPhone] = useState(loc.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true); setMsg("");
    const res = await fetch(`/api/gym/locations/${loc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, addressLine: address, city, phone }),
    });
    setMsg(res.ok ? "saved" : "failed");
    setBusy(false);
    if (res.ok) onChanged();
  }
  async function remove() {
    if (!confirm("Remove this location?")) return;
    setBusy(true);
    await fetch(`/api/gym/locations/${loc.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="card">
      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="row" style={{ gap: "0.5rem", marginTop: "0.6rem" }}>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={{ flex: 1 }} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={{ flex: 1 }} />
      </div>
      <div className="row" style={{ marginTop: "0.8rem", gap: "0.5rem" }}>
        <button className="primary" disabled={busy} onClick={save}>Save</button>
        <button className="danger" disabled={busy} onClick={remove}>Remove</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </div>
  );
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
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
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

  return (
    <>
      {locs.map((l) => (
        <LocationRow key={l.id} loc={l} onChanged={load} />
      ))}

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
