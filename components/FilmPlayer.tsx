"use client";
import { useEffect, useRef, useState } from "react";
import { photoThumb } from "@/lib/supabase";
import type { Frame } from "@/lib/data";

const FPS = 3;

export default function FilmPlayer({
  title,
  frames,
  onClose,
}: {
  title: string;
  frames: Frame[];
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    timer.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % frames.length);
    }, 1000 / FPS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, frames.length]);

  if (frames.length === 0) return null;
  const current = frames[Math.min(idx, frames.length - 1)];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(20,18,12,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(440px, 100%)", background: "#fff", border: "3px solid var(--text)" }}
      >
        {/* image */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "#000", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoThumb(current.photo_path, 800)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div className="type-label" style={{ position: "absolute", top: 8, left: 8, background: "var(--text)", color: "#fff", padding: "3px 8px" }}>
            {idx + 1} / {frames.length}
          </div>
        </div>

        {/* scrubber */}
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={Math.min(idx, frames.length - 1)}
          onChange={(e) => {
            setPlaying(false);
            setIdx(parseInt(e.target.value));
          }}
          style={{ width: "100%", display: "block", margin: 0 }}
        />

        {/* controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div className="type-md" style={{ fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
            <div className="type-label" style={{ color: "var(--muted)" }}>
              {current.watered_by || "Anonym"} · {new Date(current.watered_at).toLocaleDateString("cs")}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button className="btn btn-sun" style={{ padding: "10px 14px" }} onClick={() => setPlaying((p) => !p)}>
              {playing ? "Pauza" : "Přehrát"}
            </button>
            <button className="btn btn-ghost" style={{ padding: "10px 14px" }} onClick={onClose}>Zavřít</button>
          </div>
        </div>
      </div>
    </div>
  );
}
