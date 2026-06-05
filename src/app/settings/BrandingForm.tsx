"use client";

import { useState } from "react";

export default function BrandingForm({
  appName,
  primaryColor,
  accentColor,
  logoUrl,
}: {
  appName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
}) {
  const [name, setName] = useState(appName);
  const [primary, setPrimary] = useState(primaryColor);
  const [accent, setAccent] = useState(accentColor);
  const [logo, setLogo] = useState(logoUrl);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/gym/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appName: name,
        primaryColor: primary,
        accentColor: accent,
        logoUrl: logo,
      }),
    });
    setMsg(res.ok ? "Saved. Reload to see colors apply." : (await res.json()).error ?? "Failed.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 420 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        <label>App name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Big Gym" />

        <label>Primary color</label>
        <div className="row">
          <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
          <input value={primary} onChange={(e) => setPrimary(e.target.value)} style={{ width: 110 }} />
        </div>

        <label>Accent color</label>
        <div className="row">
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
          <input value={accent} onChange={(e) => setAccent(e.target.value)} style={{ width: 110 }} />
        </div>

        <label>Logo URL (optional)</label>
        <input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…/logo.png" />

        <button className="primary" disabled={busy} type="submit">Save branding</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
  );
}
