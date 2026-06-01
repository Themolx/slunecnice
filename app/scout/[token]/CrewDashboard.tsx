"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SpotMapWrapper from "@/components/SpotMapWrapper";
import type { MapMarker } from "@/components/SpotMap";
import { STATUS_COLORS, STATUS_LABELS, type Spot } from "@/lib/supabase";

export interface CrewSpot extends Spot {
  namedCount: number;
}

type Filter = "all" | "planting" | "water";

export default function CrewDashboard({ token, spots }: { token: string; spots: CrewSpot[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const visible = spots.filter((s) => (filter === "all" ? true : s.kind === filter));

  const markers: MapMarker[] = useMemo(
    () =>
      visible.map((s) =>
        s.kind === "water"
          ? { id: s.id, lat: s.lat, lon: s.lon, kind: "water" as const, color: "#1E7A3D", size: 28, emoji: "" }
          : { id: s.id, lat: s.lat, lon: s.lon, kind: "planting" as const, color: STATUS_COLORS[s.status], size: 30, emoji: "" }
      ),
    [visible]
  );

  return (
    <div>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, padding: 12, flexWrap: "wrap" }}>
        <Link href={`/scout/${token}/novy`} className="btn btn-sun" style={{ flex: "1 1 120px" }}>
          + Místo
        </Link>
        <Link href={`/scout/${token}/sazeni`} className="btn btn-ink" style={{ flex: "1 1 120px" }}>
           Sázení
        </Link>
        <Link href={`/scout/${token}/voda`} className="btn btn-leaf" style={{ flex: "1 1 120px" }}>
           Voda
        </Link>
        <Link href={`/scout/${token}/stats`} className="btn btn-ghost" style={{ flex: "1 1 100px" }}>
          Statistiky
        </Link>
      </div>

      {/* Map */}
      <div style={{ height: "44vh", margin: "0 12px", border: "3px solid var(--text)", borderRadius: 0, overflow: "hidden" }}>
        <SpotMapWrapper markers={markers} grayscale onMarkerClick={(id) => router.push(`/scout/${token}/${id}`)} />
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, padding: "14px 12px 6px" }}>
        {(["all", "planting", "water"] as Filter[]).map((f) => (
          <button
            key={f}
            className="pill"
            style={{ cursor: "pointer", background: filter === f ? "var(--text)" : "#fff", color: filter === f ? "var(--bg)" : "var(--text)" }}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Vše" : f === "planting" ? "Sázení" : "Voda"} ({spots.filter((s) => (f === "all" ? true : s.kind === f)).length})
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: "6px 12px 40px", display: "grid", gap: 8 }}>
        {visible.length === 0 && (
          <div className="type-body" style={{ color: "var(--muted)", padding: 20, textAlign: "center" }}>
            Zatím žádná místa. Přidej první přes „+ Místo“.
          </div>
        )}
        {visible.map((s) => (
          <Link
            key={s.id}
            href={`/scout/${token}/${s.id}`}
            className="card"
            style={{ padding: 12, display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "var(--text)" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="type-md" style={{ fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.name || (s.kind === "water" ? "Zdroj vody" : "Bez názvu")}
              </div>
              <div className="type-label" style={{ color: "var(--muted)", marginTop: 2 }}>
                {s.kind === "water"
                  ? "Voda"
                  : `${STATUS_LABELS[s.status]} · ${s.sunflower_count} ks · ${s.namedCount} pojmenováno`}
              </div>
            </div>
            {s.kind === "planting" && (
              <span style={{ width: 14, height: 14, background: STATUS_COLORS[s.status], border: "2px solid var(--text)" }} />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
