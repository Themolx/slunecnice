"use client";
import { useCallback, useEffect, useState } from "react";
import { photoThumb } from "@/lib/supabase";

/**
 * Hero image + thumbnail grid. Clicking any photo opens an in-app lightbox
 * (prev/next, keyboard, swipe) instead of jumping to the raw storage URL.
 * `photos` are storage paths, newest first.
 */
export default function PhotoGallery({ photos }: { photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const go = useCallback(
    (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, go]);

  if (photos.length === 0) {
    return (
      <div className="type-label" style={{ aspectRatio: "1 / 1", borderRadius: "var(--radius)", border: "3px solid var(--text)", background: "#efece2", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        Bez fotky
      </div>
    );
  }

  return (
    <>
      {/* hero */}
      <button
        onClick={() => setOpen(0)}
        style={{ display: "block", width: "100%", padding: 0, border: "3px solid var(--text)", borderRadius: "var(--radius)", overflow: "hidden", aspectRatio: "1 / 1", background: "#efece2", cursor: "zoom-in" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoThumb(photos[0], 800)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </button>

      {/* thumbnail grid */}
      {photos.length > 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))", gap: 8, marginTop: 10 }}>
          {photos.map((p, i) => (
            <button key={p} onClick={() => setOpen(i)} style={{ padding: 0, border: "2px solid var(--text)", borderRadius: "var(--radius-sm)", overflow: "hidden", aspectRatio: "1", cursor: "zoom-in", background: "#efece2" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoThumb(p, 200)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      {/* lightbox */}
      {open !== null && (
        <div
          onClick={close}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(20,18,12,0.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}
        >
          <button onClick={close} aria-label="Zavřít" style={{ position: "absolute", top: 14, right: 14, width: 40, height: 40, background: "#fff", border: "3px solid var(--text)", borderRadius: "var(--radius-sm)", fontWeight: 900, fontSize: 16, cursor: "pointer", zIndex: 2 }}>✕</button>

          <div className="type-label" style={{ position: "absolute", top: 22, left: 16, color: "#fff" }}>
            {open + 1} / {photos.length}
          </div>

          {photos.length > 1 && (
            <>
              <Nav side="left" onClick={(e) => { e.stopPropagation(); go(-1); }} />
              <Nav side="right" onClick={(e) => { e.stopPropagation(); go(1); }} />
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoThumb(photos[open], 1400, 82)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", border: "3px solid var(--text)", borderRadius: "var(--radius-sm)", background: "#000" }}
          />
        </div>
      )}
    </>
  );
}

function Nav({ side, onClick }: { side: "left" | "right"; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Předchozí" : "Další"}
      style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", [side]: 10, width: 46, height: 46, background: "rgba(255,255,255,0.92)", border: "3px solid var(--text)", borderRadius: "var(--radius-sm)", fontWeight: 900, fontSize: 22, cursor: "pointer", lineHeight: 1, zIndex: 2 }}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
