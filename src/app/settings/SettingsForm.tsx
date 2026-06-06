"use client";

import { useState } from "react";

const THEMES: { key: string; label: string; accent: string }[] = [
  { key: "emerald", label: "Emerald", accent: "#a8e80c" },
  { key: "crimson", label: "Crimson", accent: "#fb5a4b" },
  { key: "ocean", label: "Ocean", accent: "#3b82f6" },
  { key: "sunset", label: "Sunset", accent: "#ff8a3d" },
  { key: "violet", label: "Violet", accent: "#8b5cf6" },
];

export default function SettingsForm({
  appName,
  theme,
  themeMode,
  logoUrl,
}: {
  appName: string;
  theme: string;
  themeMode: string;
  logoUrl: string | null;
}) {
  const [name, setName] = useState(appName);
  const [sel, setSel] = useState(theme);
  const [mode, setMode] = useState(themeMode);
  const [logo, setLogo] = useState(logoUrl);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveTheme() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/gym/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appName: name, theme: sel, themeMode: mode }),
    });
    if (res.ok) {
      setMsg("Saved — reloading…");
      setTimeout(() => window.location.reload(), 500);
    } else {
      setMsg((await res.json()).error ?? "Failed.");
      setBusy(false);
    }
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/branding/logo", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setLogo(data.url);
      setMsg("Logo uploaded — reloading…");
      setTimeout(() => window.location.reload(), 600);
    } else {
      setMsg(data.error ?? "Upload failed.");
      setBusy(false);
    }
  }

  return (
    <>
      {/* Live preview tile */}
      <div className="card accent">
        <div className="row" style={{ gap: "0.6rem" }}>
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="logo" style={{ height: 34, borderRadius: 8 }} />
          )}
          <strong style={{ fontSize: "1.2rem" }}>{name || "Your gym"}</strong>
        </div>
        <p style={{ margin: "0.4rem 0 0", opacity: 0.8 }}>Theme preview</p>
      </div>

      <div className="card">
        <label>App name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Big Gym" />

        <p style={{ margin: "1rem 0 0.4rem", fontWeight: 700 }}>Theme</p>
        <div className="row" style={{ gap: "0.5rem" }}>
          {THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSel(t.key)}
              title={t.label}
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: t.accent,
                border: sel === t.key ? "3px solid var(--fg)" : "3px solid transparent",
                padding: 0,
              }}
            />
          ))}
        </div>

        <p style={{ margin: "1rem 0 0.4rem", fontWeight: 700 }}>Mode</p>
        <div className="row" style={{ gap: "0.5rem" }}>
          <button type="button" className={mode === "light" ? "primary" : ""} onClick={() => setMode("light")}>
            ☀ Light
          </button>
          <button type="button" className={mode === "dark" ? "primary" : ""} onClick={() => setMode("dark")}>
            ☾ Dark
          </button>
        </div>

        <div className="row" style={{ marginTop: "1.2rem", gap: "0.6rem" }}>
          <button className="primary" disabled={busy} onClick={saveTheme}>
            Save
          </button>
          {msg && <span className="muted">{msg}</span>}
        </div>
      </div>

      <div className="card">
        <label>Logo</label>
        <div className="row" style={{ gap: "0.8rem", marginTop: "0.4rem" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="logo" style={{ height: 48, borderRadius: 10 }} />
          ) : (
            <span className="muted">No logo</span>
          )}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo} disabled={busy} />
        </div>
        <p className="muted" style={{ margin: "0.5rem 0 0" }}>PNG/JPG/WEBP/SVG, max 2 MB.</p>
      </div>
    </>
  );
}
