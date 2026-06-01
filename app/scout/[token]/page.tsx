import CrewHeader from "@/components/CrewHeader";
import CrewDashboard, { type CrewSpot } from "./CrewDashboard";
import { fetchSpots, fetchNamedCounts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ScoutHome({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let spots: CrewSpot[] = [];
  let dbError: string | null = null;
  try {
    const [all, named] = await Promise.all([fetchSpots(), fetchNamedCounts()]);
    spots = all.map((s) => ({ ...s, namedCount: named.get(s.id) ?? 0 }));
  } catch (e) {
    dbError = e instanceof Error ? e.message : "DB chyba";
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <CrewHeader token={token} title="Zahradníci" />
      {dbError ? (
        <div className="type-body" style={{ padding: 20, color: "#C0392B" }}>
          Supabase není připojené: {dbError}. Vyplň .env.local a spusť schema.sql.
        </div>
      ) : (
        <CrewDashboard token={token} spots={spots} />
      )}
    </div>
  );
}
