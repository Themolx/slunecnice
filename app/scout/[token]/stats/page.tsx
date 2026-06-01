import CrewHeader from "@/components/CrewHeader";
import { fetchStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StatsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const s = await fetchStats();

  const rows: [string, number][] = [
    ["Míst k sázení", s.plantingSpots],
    ["Zdrojů vody", s.waterSpots],
    ["Slunečnic celkem", s.totalSunflowers],
    ["Pojmenováno", s.namedSunflowers],
    ["Zálivek", s.totalWaterings],
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <CrewHeader token={token} title="Statistiky" back />
      <div style={{ padding: 16, maxWidth: 620, margin: "0 auto", display: "grid", gap: 10 }}>
        {rows.map(([label, n]) => (
          <div key={label} className="card" style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="type-label" style={{ color: "var(--muted)" }}>
              {label}
            </span>
            <span className="type-lg">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
