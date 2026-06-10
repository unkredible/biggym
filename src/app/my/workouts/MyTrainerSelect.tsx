"use client";

import { useState } from "react";
import { IconUser } from "@/components/icons";

interface Trainer { id: string; fullName: string; image: string | null }

/** Profile-style trainer card: avatar puck + name, picker below. */
export default function MyTrainerSelect({
  trainers,
  current,
}: {
  trainers: Trainer[];
  current: string | null;
}) {
  const [val, setVal] = useState(current ?? "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const sel = trainers.find((t) => t.id === val) ?? null;

  async function save(v: string) {
    setVal(v);
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/my/trainer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerId: v || null }),
    });
    setMsg(res.ok ? "salvato" : "errore");
    setBusy(false);
  }

  return (
    <div className="section-hero" style={{ margin: "0.9rem 0 0" }}>
      <span className="avatar" style={{ width: 56, height: 56 }}>
        {sel?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sel.image} alt={sel.fullName} />
        ) : (
          <IconUser width={24} height={24} />
        )}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="sh-t" style={{ fontSize: "1.1rem" }}>
          {sel ? sel.fullName : "Nessun trainer"}
        </div>
        <div className="sh-s">Il tuo personal trainer</div>
        <div className="row" style={{ marginTop: "0.45rem" }}>
          <select value={val} disabled={busy} onChange={(e) => save(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">— scegli —</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>
          {msg && <span className="muted">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
