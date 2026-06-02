"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SpotMapWrapper from "@/components/SpotMapWrapper";
import type { MapMarker } from "@/components/SpotMap";
import { STATUS_COLORS, STATUS_LABELS, photoThumb, type Spot } from "@/lib/supabase";

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
          ? { id: s.id, lat: s.lat, lon: s.lon, kind: "water" as const, color: "#1E7A3D", border: "#0F4D26", size: 26 }
          : { id: s.id, lat: s.lat, lon: s.lon, kind: "planting" as const, color: "#F5C518", border: STATUS_COLORS[s.status], size: 28 }
      ),
    [visible]
  );

  return (
    <div>
      {/* Primary action */}
      <div style={{ display: "flex", gap: 8, padding: 12 }}>
        <Link href={`/scout/${token}/novy`} className="btn btn-sun" style={{ flex: 1, fontSize: 16, padding: "15px 20px" }}>
          + Scoutnout místo
        </Link>
        <Link href={`/scout/${token}/stats`} className="btn btn-ghost" style={{ flexShrink: 0 }}>
          Statistiky
        </Link>
      </div>

      {/* Map */}
      <div style={{ height: "42vh", margin: "0 12px", border: "3px solid var(--text)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <SpotMapWrapper markers={markers} onMarkerClick={(id) => router.push(`/scout/${token}/${id}`)} />
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
            {f === "all" ? "Vše" : f === "planting" ? "Slunečnice" : "Voda"} ({spots.filter((s) => (f === "all" ? true : s.kind === f)).length})
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: "6px 12px 40px", display: "grid", gap: 8 }}>
        {visible.length === 0 && (
          <div className="type-body" style={{ color: "var(--muted)", padding: 20, textAlign: "center" }}>
            Zatím nic. Scoutni první místo.
          </div>
        )}
        {visible.map((s) => {
          const cover = s.photo_paths.length > 0 ? s.photo_paths[s.photo_paths.length - 1] : null;
          return (
            <Link
              key={s.id}
              href={`/scout/${token}/${s.id}`}
              className="card"
              style={{ padding: 10, display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "var(--text)" }}
            >
              <span style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 10, border: "2px solid var(--text)", overflow: "hidden", background: s.kind === "water" ? "#1E7A3D" : "#F5C518", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {cover ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={photoThumb(cover, 110)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  s.kind === "planting" && <span style={{ width: 14, height: 14, borderRadius: 4, border: `3px solid ${STATUS_COLORS[s.status]}` }} />
                )}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="type-md" style={{ fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.name || (s.kind === "water" ? "Zdroj vody" : "Bez názvu")}
                </div>
                <div className="type-label" style={{ color: "var(--muted)", marginTop: 2 }}>
                  {s.kind === "water" ? "Voda" : STATUS_LABELS[s.status]}
                </div>
              </div>
              {s.kind === "planting" && (
                <span style={{ width: 12, height: 12, flexShrink: 0, background: STATUS_COLORS[s.status], border: "2px solid var(--text)" }} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
