"use client";
import { useState } from "react";
import { fetchSunflowerFrames, type Frame } from "@/lib/data";
import FilmPlayer from "./FilmPlayer";

export default function SunflowerFilmButton({ sunflowerId, title }: { sunflowerId: string; title: string }) {
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const play = async () => {
    setBusy(true);
    try {
      const f = frames ?? (await fetchSunflowerFrames(sunflowerId));
      setFrames(f);
      if (f.length > 0) setOpen(true);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className="pill"
        style={{ cursor: "pointer", borderColor: "var(--leaf)", color: "var(--leaf)" }}
        onClick={play}
        disabled={busy}
      >
        {busy ? "…" : "▶ Film"}
      </button>
      {open && frames && <FilmPlayer title={title} frames={frames} onClose={() => setOpen(false)} />}
    </>
  );
}
