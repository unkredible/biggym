"use client";

import { useRef, useState } from "react";
import { IconUser } from "@/components/icons";

/** Tap the avatar to upload a photo (JPEG/PNG/WebP, max 5 MB). */
export default function AvatarUpload({ src }: { src: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(src);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/me/avatar", { method: "POST", body: fd });
    if (res.ok) {
      const j = await res.json();
      setUrl(`${j.url}?t=${Date.now()}`); // bust the old cache
    }
    setBusy(false);
    e.target.value = "";
  }

  return (
    <>
      <button
        type="button"
        className="avatar"
        style={{ cursor: "pointer", padding: 0, opacity: busy ? 0.6 : 1 }}
        title="Cambia foto"
        onClick={() => input.current?.click()}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="avatar" />
        ) : (
          <IconUser width={30} height={30} />
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={onPick}
      />
    </>
  );
}
