"use client";
import { useMemo, useState } from "react";
import SpotMapWrapper from "@/components/SpotMapWrapper";
import type { MapMarker } from "@/components/SpotMap";
import { drynessColor, daysSince, type Spot } from "@/lib/supabase";
import SpotCard from "./SpotCard";

export interface HomeSpot extends Spot {
  lastWatered: string | null;
  namedCount: number;
}

export default function HomeMap({ spots }: { spots: HomeSpot[] }) {
  const [showWater, setShowWater] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = spots.find((s) => s.id === selectedId) ?? null;

  const markers: MapMarker[] = useMemo(() => {
    return spots
      .filter((s) => (s.kind === "water" ? showWater : true))
      .map((s) => {
        if (s.kind === "water") {
          return {
            id: s.id,
            lat: s.lat,
            lon: s.lon,
            kind: "water" as const,
            color: "#1E7A3D", // bright green
            border: "#0F4D26",
            size: 24,
          };
        }
        // Sunflowers: always bright yellow fill so they scream on the gray map.
        // Dryness is shown as the border colour (green fresh -> red thirsty).
        const days = daysSince(s.lastWatered);
        const size = Math.min(54, 26 + (s.sunflower_count || 0) * 2.2);
        return {
          id: s.id,
          lat: s.lat,
          lon: s.lon,
          kind: "planting" as const,
          color: "#F5C518", // sunflower yellow
          border: drynessColor(days),
          size,
        };
      })
      // Draw water last so it sits on top when a tap shares a sunflower's spot.
      .sort((a, b) => (a.kind === "water" ? 1 : 0) - (b.kind === "water" ? 1 : 0));
  }, [spots, showWater]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <SpotMapWrapper
        markers={markers}
        grayscale
        onMarkerClick={(id) => setSelectedId(id)}
      />

      {selected && (
        <SpotCard key={selected.id} spot={selected} onClose={() => setSelectedId(null)} />
      )}

      {/* Water layer toggle (hidden while a card is open) */}
      {!selected && (
      <button
        onClick={() => setShowWater((v) => !v)}
        className="pill"
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          zIndex: 5,
          background: showWater ? "#1E7A3D" : "#fff",
          color: showWater ? "#fff" : "var(--text)",
          borderColor: "#1E7A3D",
          cursor: "pointer",
        }}
      >
        Voda {showWater ? "zap" : "vyp"}
      </button>
      )}

      {/* Dryness legend (hidden while a card is open) */}
      {!selected && (
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          zIndex: 5,
          background: "rgba(255,253,245,0.94)",
          border: "2px solid var(--text)",
          borderRadius: 0,
          padding: "8px 12px",
        }}
      >
        <div className="type-label" style={{ marginBottom: 6 }}>
          Suchost · okraj
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[
            ["#1E7A3D", "čerstvé"],
            ["#7FB800", ""],
            ["#F5C518", ""],
            ["#E67E22", ""],
            ["#C0392B", "suché"],
          ].map(([c, label], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 0,
                  background: "#F5C518",
                  border: `3px solid ${c as string}`,
                }}
              />
              {label && (
                <div style={{ fontSize: 8, fontWeight: 700, marginTop: 2 }}>{label}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
