import PublicNav from "@/components/PublicNav";
import { fetchLeaderboard, type GardenerScore } from "@/lib/data";

export const revalidate = 30;
export const metadata = { title: "Žebříček zahradníků — Slunečnice" };

export default async function LeaderboardPage() {
  let rows: GardenerScore[] = [];
  try {
    rows = await fetchLeaderboard();
  } catch {
    /* db not ready */
  }

  return (
    <>
      <PublicNav />
      <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: "28px 18px 60px" }}>
        <div className="type-label" style={{ color: "var(--muted)" }}>
          Kdo se nejvíc stará
        </div>
        <h1 className="type-xl" style={{ marginTop: 6 }}>
          Žebříček
        </h1>
        <p className="type-body" style={{ maxWidth: 520, marginTop: 12 }}>
          Za každou zálivku 10 bodů. Najdi nejbližší slunečnici, zalij ji a vyfoť.
        </p>

        <div className="bar bar-sun" style={{ margin: "20px 0", maxWidth: 120 }} />

        {rows.length === 0 ? (
          <p className="type-body" style={{ color: "var(--muted)" }}>
            Zatím nikdo. Buď první · najdi slunečnici na mapě a zalij ji.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {rows.map((r, i) => (
              <div
                key={r.name}
                className="card"
                style={{
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: i === 0 ? "var(--sun)" : "#fff",
                }}
              >
                <div className="type-lg" style={{ fontSize: 28, minWidth: 44, textAlign: "center" }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="type-md" style={{ fontSize: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.name}
                  </div>
                  <div className="type-label" style={{ color: i === 0 ? "var(--text)" : "var(--muted)", marginTop: 2 }}>
                    {r.waterings} zálivek
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="type-lg" style={{ fontSize: 26 }}>{r.score}</div>
                  <div className="type-label" style={{ color: i === 0 ? "var(--text)" : "var(--muted)" }}>bodů</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
