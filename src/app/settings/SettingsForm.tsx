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
  bannerUrl,
}: {
  appName: string;
  theme: string;
  themeMode: string;
  logoUrl: string | null;
  bannerUrl: string | null;
}) {
  const [name, setName] = useState(appName);
  const [sel, setSel] = useState(theme);
  const [mode, setMode] = useState(themeMode);
  const [logo, setLogo] = useState(logoUrl);
  const [banner, setBanner] = useState(bannerUrl);
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

  async function uploadImage(
    kind: "logo" | "banner",
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/branding/${kind}`, { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      if (kind === "logo") setLogo(data.url);
      else setBanner(data.url);
      setMsg(`${kind} uploaded — reloading…`);
      setTimeout(() => window.location.reload(), 600);
    } else {
      setMsg(data.error ?? "Upload failed.");
      setBusy(false);
    }
  }

  return (
    <>
      {/* Live preview banner */}
      <div
        className="card accent"
        style={
          banner
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55)), url(${banner})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                color: "#fff",
                minHeight: 130,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }
            : undefined
        }
      >
        <div className="row" style={{ gap: "0.6rem" }}>
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="logo" style={{ height: 34, borderRadius: 8 }} />
          )}
          <strong style={{ fontSize: "1.3rem" }}>{name || "Your gym"}</strong>
        </div>
        <p style={{ margin: "0.3rem 0 0", opacity: 0.8 }}>Banner preview</p>
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
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => uploadImage("logo", e)}
            disabled={busy}
          />
        </div>
        <p className="muted" style={{ margin: "0.5rem 0 0" }}>PNG/JPG/WEBP/SVG, max 2 MB.</p>
      </div>

      <div className="card">
        <label>Banner image</label>
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt="banner"
            style={{ width: "100%", maxHeight: 130, objectFit: "cover", borderRadius: 12, margin: "0.5rem 0" }}
          />
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => uploadImage("banner", e)}
          disabled={busy}
        />
        <p className="muted" style={{ margin: "0.5rem 0 0" }}>Wide image, max 5 MB — shown behind the gym banner.</p>
      </div>
    </>
  );
}
