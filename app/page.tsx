import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import Onboarding from "@/components/Onboarding";
import HomeMap, { type HomeSpot } from "./HomeMap";
import { fetchSpots, fetchLastWateredMap, fetchNamedCounts, fetchStats } from "@/lib/data";

// ISR: regenerate at most once a minute, regardless of traffic. Keeps Supabase
// egress low; the page is fresh enough for a public map.
export const revalidate = 60;

export const metadata = {
  title: "Slunečnice — živá mapa",
};

export default async function HomePage() {
  let spots: HomeSpot[] = [];
  let stats = { plantingSpots: 0, waterSpots: 0, totalSunflowers: 0, namedSunflowers: 0, totalWaterings: 0, weeklyWaterings: 0 };
  try {
    const [allSpots, lastWatered, namedCounts, s] = await Promise.all([
      fetchSpots(),
      fetchLastWateredMap(),
      fetchNamedCounts(),
      fetchStats(),
    ]);
    stats = s;
    spots = allSpots.map((sp) => ({
      ...sp,
      lastWatered: lastWatered.get(sp.id) ?? null,
      namedCount: namedCounts.get(sp.id) ?? 0,
    }));
  } catch {
    // Supabase not configured yet — render empty map.
  }

  return (
    <>
      <Onboarding />
      <PublicNav />

      {/* Hero */}
      <section style={{ padding: "28px 18px 18px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div className="type-label" style={{ color: "var(--muted)" }}>
          Kolektivní sázení ve městě
        </div>
        <h1 className="type-xl" style={{ marginTop: 6 }}>
          Slunečnice
        </h1>
        <p className="type-body" style={{ maxWidth: 560, marginTop: 14 }}>
          Sázíme slunečnice po celém městě. Na mapě je vidíš všechny. Najdi tu
          nejbližší, zalij ji a pojmenuj. Péče odemyká jméno.
        </p>

        {/* Stats bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
          <Stat n={stats.totalSunflowers} label="slunečnic" />
          <Stat n={stats.plantingSpots} label="míst" />
          <Stat n={stats.namedSunflowers} label="pojmenováno" />
          <Stat n={stats.totalWaterings} label="zálivek" />
          <Stat n={stats.waterSpots} label="zdrojů vody" leaf />
        </div>

        {/* Game CTA */}
        <Link
          href="/zebricek"
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 12,
            padding: "10px 16px",
            textDecoration: "none",
            color: "var(--text)",
            background: "var(--sun)",
          }}
        >
          <span className="type-label">
            {stats.weeklyWaterings} zálivek tento týden · zalij a sbírej body
          </span>
          <span className="type-md" style={{ fontSize: 16 }}>Žebříček →</span>
        </Link>
      </section>

      <div className="bar bar-sun" style={{ maxWidth: 1100, margin: "0 auto", width: "calc(100% - 36px)" }} />

      {/* Map */}
      <section
        style={{
          maxWidth: 1100,
          margin: "18px auto 0",
          width: "calc(100% - 36px)",
          height: "min(70vh, 640px)",
          border: "3px solid var(--text)",
          borderRadius: 0,
          overflow: "hidden",
        }}
      >
        <HomeMap spots={spots} />
      </section>

      <footer
        style={{
          maxWidth: 1100,
          margin: "20px auto 40px",
          width: "calc(100% - 36px)",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="type-label" style={{ color: "var(--muted)" }}>
           Slunečnice · {new Date().getFullYear()}
        </span>
        <Link href="/o-projektu" className="btn btn-ghost">
          O projektu →
        </Link>
      </footer>
    </>
  );
}

function Stat({ n, label, leaf }: { n: number; label: string; leaf?: boolean }) {
  return (
    <div
      className="card"
      style={{
        padding: "8px 14px",
        display: "flex",
        alignItems: "baseline",
        gap: 7,
        background: leaf ? "#eef6f0" : "#fff",
      }}
    >
      <span className="type-md" style={{ color: leaf ? "var(--leaf)" : "var(--text)" }}>
        {n}
      </span>
      <span className="type-label" style={{ color: "var(--muted)" }}>
        {label}
      </span>
    </div>
  );
}
