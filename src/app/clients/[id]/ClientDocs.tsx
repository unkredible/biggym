"use client";

import { useCallback, useEffect, useState } from "react";

interface Doc {
  id: string;
  name: string;
  createdAt: string;
}

export default function ClientDocs({ clientId }: { clientId: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/documents`);
    if (res.ok) setDocs((await res.json()).documents ?? []);
  }, [clientId]);
  useEffect(() => { load(); }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/clients/${clientId}/documents`, { method: "POST", body: fd });
    setMsg(res.ok ? "Uploaded." : (await res.json()).error ?? "Failed.");
    if (res.ok) load();
    setBusy(false);
    e.target.value = "";
  }

  async function remove(id: string) {
    if (!confirm("Delete this PDF?")) return;
    await fetch(`/api/client-docs/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="card">
        <strong>Upload workout card (PDF)</strong>
        <p className="muted" style={{ margin: "0.2rem 0 0.6rem" }}>
          It becomes available on the client&apos;s page. PDF, max 15 MB.
        </p>
        <input type="file" accept="application/pdf" onChange={upload} disabled={busy} />
        {msg && <p className="muted" style={{ margin: "0.5rem 0 0" }}>{msg}</p>}
      </div>

      {docs.length > 0 && (
        <div className="list">
          {docs.map((d) => (
            <div className="list-row" key={d.id}>
              <span className="lr-icon">📄</span>
              <a href={`/api/client-docs/${d.id}`} target="_blank" rel="noreferrer">{d.name}</a>
              <span className="lr-value">
                {new Date(d.createdAt).toLocaleDateString()}{" "}
                <button className="danger" style={{ padding: "0.2rem 0.6rem", marginLeft: "0.5rem" }} onClick={() => remove(d.id)}>✕</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
