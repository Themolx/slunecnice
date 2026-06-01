"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SpotMapWrapper from "@/components/SpotMapWrapper";
import type { MapMarker } from "@/components/SpotMap";
import { drynessColor, daysSince, distanceMetres, WATER_LABELS, STATUS_LABELS, type Spot } from "@/lib/supabase";

export interface HomeSpot extends Spot {
  lastWatered: string | null;
}

type Sheet = "peek" | "full";

export default function FindMy({ spots }: { spots: HomeSpot[] }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>("peek");
  const [showWater, setShowWater] = useState(true);
  const [user, setUser] = useState<{ lat: number; lon: number } | null>(null);

  // Get the user's location to sort by distance (permission usually granted in onboarding).
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUser({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const list = useMemo(() => {
    const withDist = spots
      .filter((s) => (s.kind === "water" ? showWater : true))
      .map((s) => ({
        spot: s,
        dist: user ? distanceMetres(user, { lat: s.lat, lon: s.lon }) : null,
      }));
    withDist.sort((a, b) => {
      if (a.dist !== null && b.dist !== null) return a.dist - b.dist;
      // no GPS: thirstiest (oldest watering) first
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
    if (m === null) return "";
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Map */}
      <div style={{ position: "absolute", inset: 0 }}>
        <SpotMapWrapper
          markers={markers}
          center={user ? [user.lon, user.lat] : undefined}
          zoom={user ? 13.5 : 11.5}
          grayscale
          onMarkerClick={(id) => router.push(`/misto/${id}`)}
        />
      </div>

      {/* Water toggle */}
      <button
        onClick={() => setShowWater((v) => !v)}
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
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          boxShadow: "0 -10px 30px rgba(0,0,0,0.12)",
          height: sheet === "full" ? "78%" : 196,
          transition: "height 0.28s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* grabber + header */}
        <button
          onClick={() => setSheet((s) => (s === "peek" ? "full" : "peek"))}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 0 6px", width: "100%" }}
          aria-label="Rozbalit seznam"
        >
          <div style={{ width: 42, height: 5, borderRadius: 999, background: "#d8d2bf", margin: "0 auto" }} />
        </button>
        <div style={{ padding: "0 18px 10px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div className="type-md">Slunečnice poblíž</div>
          <div className="type-label" style={{ color: "var(--muted)" }}>{list.length}</div>
        </div>

        {/* list */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 12px 16px" }}>
          {list.length === 0 && (
            <div className="type-body" style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>
              Zatím tu nic není.
            </div>
          )}
          {list.map(({ spot: s, dist }) => {
            const isWater = s.kind === "water";
            const days = daysSince(s.lastWatered);
            return (
              <button
                key={s.id}
                onClick={() => router.push(`/misto/${s.id}`)}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid #eee", cursor: "pointer", padding: "12px 6px", display: "flex", alignItems: "center", gap: 12 }}
              >
                <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 10, border: "2px solid var(--text)", background: isWater ? "#1E7A3D" : "#F5C518", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {!isWater && <span style={{ width: 12, height: 12, borderRadius: 4, border: `3px solid ${drynessColor(days)}` }} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="type-md" style={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.name || (isWater ? "Zdroj vody" : "Slunečnice")}
                  </div>
                  <div className="type-label" style={{ color: "var(--muted)", marginTop: 2 }}>
                    {isWater ? (s.water_type ? WATER_LABELS[s.water_type] : "Voda") : `${STATUS_LABELS[s.status]}${days === null ? "" : ` · ${days === 0 ? "zaléváno dnes" : days + " dní bez vody"}`}`}
                  </div>
                </div>
                <div className="type-label" style={{ color: dist !== null && dist < 150 ? "var(--leaf)" : "var(--muted)", flexShrink: 0 }}>
                  {dist === null ? "›" : dist < 80 ? "tady" : fmtDist(dist)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
