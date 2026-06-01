"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { photoThumb, daysSince, drynessColor, WATER_LABELS } from "@/lib/supabase";
import type { HomeSpot } from "./HomeMap";

/**
 * Lightweight preview popup shown when a marker is clicked. Photo + basic info
 * only. "Zalít" navigates to the full page where the watering/camera flow lives.
 */
export default function SpotCard({ spot, onClose }: { spot: HomeSpot; onClose: () => void }) {
  const router = useRouter();
  const [photoIdx, setPhotoIdx] = useState(0);

  const isWater = spot.kind === "water";
  const photos = spot.photo_paths ?? [];
  const days = daysSince(spot.lastWatered);
  const total = spot.sunflower_count;

  const go = () => router.push(`/misto/${spot.id}`);

  return (
    <>
      <div onClick={onClose} className="absolute inset-0 z-10 anim-fade" style={{ background: "rgba(20,18,12,0.28)" }} />

      <div
        className="
          absolute z-20 bg-white flex flex-col overflow-hidden anim-slideup
          inset-x-0 bottom-0
          lg:inset-x-auto lg:bottom-auto lg:top-4 lg:left-4 lg:w-[340px]
        "
        style={{ border: "3px solid var(--text)" }}
      >
        {/* photo / carousel */}
        {photos.length > 0 ? (
          <div className="relative w-full flex-shrink-0" style={{ background: "#efece2", aspectRatio: "4 / 3", maxHeight: "40vh" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoThumb(photos[Math.min(photoIdx, photos.length - 1)], 640, 65)}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {photos.length > 1 && (
              <>
                <CarBtn side="left" onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)} />
                <CarBtn side="right" onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)} />
                <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
                  {photos.map((_, i) => (
                    <span key={i} style={{ width: 7, height: 7, background: i === Math.min(photoIdx, photos.length - 1) ? "#fff" : "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.5)" }} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-shrink-0 flex items-center justify-center type-label" style={{ aspectRatio: "4 / 3", maxHeight: "26vh", background: "#efece2", color: "var(--muted)" }}>
            Bez fotky
          </div>
        )}

        {/* close */}
        <button
          onClick={onClose}
          aria-label="Zavřít"
          className="absolute"
          style={{ top: 10, right: 10, zIndex: 3, width: 34, height: 34, background: "#fff", border: "3px solid var(--text)", fontWeight: 900, fontSize: 16, cursor: "pointer", lineHeight: 1 }}
        >
          ✕
        </button>

        {/* body */}
        <div style={{ padding: 16 }}>
          <div className="type-lg" style={{ fontSize: 24 }}>
            {spot.name || (isWater ? "Zdroj vody" : "Slunečnice")}
          </div>

          {isWater ? (
            <div className="type-label" style={{ marginTop: 8, color: "var(--leaf)" }}>
              {spot.water_type ? WATER_LABELS[spot.water_type] : "Zdroj vody"}
            </div>
          ) : (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="type-label">{total} slunečnic · {spot.namedCount} pojmenováno</span>
              <span className="type-label" style={{ color: drynessColor(days), display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 9, height: 9, background: drynessColor(days), border: "1.5px solid var(--text)" }} />
                {days === null ? "nezaléváno" : days === 0 ? "zaléváno dnes" : `${days} dní bez vody`}
              </span>
            </div>
          )}

          {spot.notes && (
            <p className="type-body" style={{ marginTop: 10, color: "var(--muted)" }}>{spot.notes}</p>
          )}

          {!isWater && (
            <button className="btn btn-leaf" style={{ width: "100%", marginTop: 16 }} onClick={go}>
              Zalít →
            </button>
          )}
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={go}>
            {isWater ? "Detail" : "Otevřít detail"}
          </button>
        </div>
      </div>
    </>
  );
}

function CarBtn({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Předchozí" : "Další"}
      style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", [side]: 8, width: 36, height: 36, background: "rgba(255,255,255,0.92)", border: "3px solid var(--text)", fontWeight: 900, fontSize: 18, cursor: "pointer", lineHeight: 1, zIndex: 2 }}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
