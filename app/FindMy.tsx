"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SpotMapWrapper from "@/components/SpotMapWrapper";
import type { MapMarker } from "@/components/SpotMap";
import {
  supabase,
  photoThumb,
  drynessColor,
  daysSince,
  distanceMetres,
  WATER_LABELS,
  STATUS_LABELS,
  type Spot,
} from "@/lib/supabase";
import { snap as hapticSnap, tap } from "@/lib/haptics";

export interface HomeSpot extends Spot {
  lastWatered: string | null;
}

export default function FindMy({ spots }: { spots: HomeSpot[] }) {
  const router = useRouter();
  const [showWater, setShowWater] = useState(true);
  const [user, setUser] = useState<{ lat: number; lon: number } | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lon: number } | null>(null);

  // ── Sheet drag state ────────────────────────────────────────────────────────
  const [vh, setVh] = useState(800);
  const snaps = useMemo(() => {
    const mini = 74; // just the grabber + header — whole map visible
    const peek = Math.min(330, Math.round(vh * 0.42));
    const mid = Math.round(vh * 0.55);
    const full = Math.round(vh * 0.86);
    return { mini, peek, mid, full, list: [mini, peek, mid, full] };
  }, [vh]);
  const [h, setH] = useState(330);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ startY: 0, startH: 0, lastY: 0, lastT: 0, v: 0, moved: 0 });

  useEffect(() => {
    const set = () => setVh(window.innerHeight);
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);
  // clamp height into range when viewport changes
  useEffect(() => {
    setH((cur) => Math.max(snaps.mini, Math.min(snaps.full, cur || snaps.peek)));
  }, [snaps.mini, snaps.peek, snaps.full]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { startY: e.clientY, startH: h, lastY: e.clientY, lastT: performance.now(), v: 0, moved: 0 };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const d = drag.current;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    d.v = (d.lastY - e.clientY) / dt; // px/ms, positive = expanding
    d.lastY = e.clientY;
    d.lastT = now;
    d.moved += Math.abs(e.movementY || 0);
    const next = Math.max(snaps.mini, Math.min(snaps.full, d.startH + (d.startY - e.clientY)));
    setH(next);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const d = drag.current;
    // tap (no real movement) → expanded collapses to mini, otherwise expand to full
    if (d.moved < 6) {
      const target = h > snaps.peek + 20 ? snaps.mini : snaps.full;
      setH(target);
      tap();
      return;
    }
    let target: number;
    if (Math.abs(d.v) > 0.45) {
      target = d.v > 0 ? (snaps.list.find((s) => s > h + 1) ?? snaps.full) : ([...snaps.list].reverse().find((s) => s < h - 1) ?? snaps.peek);
    } else {
      target = snaps.list.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a));
    }
    setH(target);
    hapticSnap();
  };

  // ── Location ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUser({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Realtime ────────────────────────────────────────────────────────────────
  const refreshTimer = useRef<number | null>(null);
  useEffect(() => {
    const bump = () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => router.refresh(), 600);
    };
    const channel = supabase
      .channel("public-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "spots" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "waterings" }, bump)
      .subscribe();
    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  const list = useMemo(() => {
    const withDist = spots
      .filter((s) => (s.kind === "water" ? showWater : true))
      .map((s) => ({ spot: s, dist: user ? distanceMetres(user, { lat: s.lat, lon: s.lon }) : null }));
    withDist.sort((a, b) => {
      if (a.dist !== null && b.dist !== null) return a.dist - b.dist;
      return (daysSince(b.spot.lastWatered) ?? 999) - (daysSince(a.spot.lastWatered) ?? 999);
    });
    return withDist;
  }, [spots, showWater, user]);

  const markers: MapMarker[] = useMemo(
    () =>
      list
        .map(({ spot: s }) =>
          s.kind === "water"
            ? { id: s.id, lat: s.lat, lon: s.lon, kind: "water" as const, color: "#1E7A3D", border: "#0F4D26", size: 24 }
            : { id: s.id, lat: s.lat, lon: s.lon, kind: "planting" as const, color: "#F5C518", border: drynessColor(daysSince(s.lastWatered)), size: 30 }
        )
        .sort((a, b) => (a.kind === "water" ? 1 : 0) - (b.kind === "water" ? 1 : 0)),
    [list]
  );

  const fmtDist = (m: number | null) => {
    if (m === null) return "›";
    if (m < 80) return "tady";
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
  };

  // Click a spot: briefly fly the map to it, then navigate (white-blur covers the cut).
  const open = useCallback(
    (id: string) => {
      tap();
      const s = spots.find((x) => x.id === id);
      if (s) {
        setFlyTarget({ lat: s.lat, lon: s.lon });
        window.setTimeout(() => router.push(`/misto/${id}`), 640);
      } else {
        router.push(`/misto/${id}`);
      }
    },
    [router, spots]
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <SpotMapWrapper
          markers={markers}
          center={flyTarget ? [flyTarget.lon, flyTarget.lat] : user ? [user.lon, user.lat] : undefined}
          zoom={flyTarget ? 15.5 : user ? 13.5 : 11.5}
          onMarkerClick={open}
        />
      </div>

      <button
        onClick={() => { setShowWater((v) => !v); tap(); }}
        className="pill"
        style={{ position: "absolute", top: 14, right: 14, zIndex: 5, background: showWater ? "#1E7A3D" : "#fff", color: showWater ? "#fff" : "var(--text)", borderColor: "#1E7A3D", cursor: "pointer" }}
      >
        Voda {showWater ? "zap" : "vyp"}
      </button>

      {/* Bottom sheet */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          background: "#fff",
          borderTop: "3px solid var(--text)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          boxShadow: "0 -10px 30px rgba(0,0,0,0.12)",
          height: h,
          transition: dragging ? "none" : "height 0.34s cubic-bezier(0.32,0.72,0,1)",
          display: "flex",
          flexDirection: "column",
          touchAction: "none",
          willChange: "height",
        }}
      >
        {/* drag handle (grabber + header) */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ cursor: "grab", touchAction: "none", flexShrink: 0, padding: "10px 0 0" }}
        >
          <div style={{ width: 42, height: 5, borderRadius: 999, background: "#d8d2bf", margin: "0 auto" }} />
          <div style={{ padding: "8px 18px 10px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div className="type-md">Slunečnice poblíž</div>
            <div className="type-label" style={{ color: "var(--muted)" }}>{list.length}</div>
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "0 12px 16px", touchAction: "pan-y" }}>
          {list.length === 0 && (
            <div className="type-body" style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>Zatím tu nic není.</div>
          )}
          {list.map(({ spot: s, dist }) => {
            const isWater = s.kind === "water";
            const days = daysSince(s.lastWatered);
            const cover = s.photo_paths.length > 0 ? s.photo_paths[s.photo_paths.length - 1] : null;
            return (
              <button
                key={s.id}
                onClick={() => open(s.id)}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid #eee", cursor: "pointer", padding: "12px 6px", display: "flex", alignItems: "center", gap: 12 }}
              >
                <span style={{ position: "relative", width: 52, height: 52, flexShrink: 0, borderRadius: 12, border: "2px solid var(--text)", overflow: "hidden", background: isWater ? "#1E7A3D" : "#F5C518", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {cover ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={photoThumb(cover, 120)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    !isWater && <span style={{ width: 16, height: 16, borderRadius: 5, border: `3px solid ${drynessColor(days)}` }} />
                  )}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="type-md" style={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.name || (isWater ? "Zdroj vody" : "Slunečnice")}
                  </div>
                  <div className="type-label" style={{ color: "var(--muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {isWater ? (
                      <span style={{ color: "var(--leaf)" }}>{s.water_type ? WATER_LABELS[s.water_type] : "Voda"}</span>
                    ) : (
                      <>
                        <span>{STATUS_LABELS[s.status]}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: drynessColor(days) }}>
                          <span style={{ width: 8, height: 8, background: drynessColor(days), border: "1.5px solid var(--text)" }} />
                          {days === null ? "nezaléváno" : days === 0 ? "dnes" : `${days} dní bez vody`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="type-label" style={{ color: dist !== null && dist < 150 ? "var(--leaf)" : "var(--muted)", flexShrink: 0, fontSize: 13 }}>
                  {fmtDist(dist)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
