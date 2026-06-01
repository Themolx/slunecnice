import Link from "next/link";
import { notFound } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import SpotActions from "./SpotActions";
import SunflowerFilmButton from "@/components/SunflowerFilmButton";
import { fetchSpot, fetchSunflowers, fetchWaterings } from "@/lib/data";
import {
  photoThumb,
  photoUrl,
  STATUS_LABELS,
  WATER_LABELS,
  daysSince,
  drynessColor,
} from "@/lib/supabase";

export const revalidate = 30;

export default async function SpotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const spot = await fetchSpot(id);
  if (!spot) notFound();

  const [sunflowers, waterings] = await Promise.all([
    fetchSunflowers(id),
    fetchWaterings(id),
  ]);

  const named = sunflowers.filter((s) => s.name && !s.hidden);
  const slots = sunflowers
    .filter((s) => !s.hidden)
    .map((s) => ({ id: s.id, index: s.index, name: s.name }));
  const lastWatered = waterings[0]?.watered_at ?? null;
  const days = daysSince(lastWatered);

  const isWater = spot.kind === "water";

  return (
    <>
      <PublicNav />
      <div style={{ maxWidth: 760, margin: "0 auto", width: "100%", padding: "18px 18px 60px" }}>
        <Link href="/" className="type-label" style={{ color: "var(--muted)", textDecoration: "none" }}>
          ← Zpět na mapu
        </Link>

        {/* Header */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <h1 className="type-lg">{spot.name || (isWater ? "Zdroj vody" : "Slunečnice")}</h1>
        </div>

        {/* Status pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {isWater ? (
            <span className="pill" style={{ borderColor: "var(--leaf)", color: "var(--leaf)" }}>
              {spot.water_type ? WATER_LABELS[spot.water_type] : "Voda"}
            </span>
          ) : (
            <>
              <span className="pill">{STATUS_LABELS[spot.status]}</span>
              <span className="pill" style={{ background: "var(--sun)" }}>
                {spot.sunflower_count} slunečnic
              </span>
              <span className="pill">
                {named.length} z {spot.sunflower_count} pojmenováno
              </span>
              <span
                className="pill"
                style={{ borderColor: drynessColor(days), color: drynessColor(days) }}
              >
                {days === null ? "Ještě nezaléváno" : days === 0 ? "Zaléváno dnes" : `Zaléváno před ${days} dny`}
              </span>
            </>
          )}
        </div>

        {/* Photos */}
        {spot.photo_paths.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 8,
              marginTop: 18,
            }}
          >
            {spot.photo_paths.map((p) => (
              <a key={p} href={photoUrl(p)} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoThumb(p, 300)}
                  alt=""
                  style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 0, border: "3px solid var(--text)" }}
                />
              </a>
            ))}
          </div>
        )}

        {spot.notes && (
          <p className="type-body" style={{ marginTop: 18 }}>
            {spot.notes}
          </p>
        )}

        {/* Public actions (water + name) — only for planting spots */}
        {!isWater && (
          <div style={{ marginTop: 24 }}>
            <SpotActions spotId={spot.id} spotLat={spot.lat} spotLon={spot.lon} slots={slots} />
          </div>
        )}

        {/* Named sunflowers */}
        {!isWater && named.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <h2 className="type-md" style={{ marginBottom: 12 }}>
              Pojmenované slunečnice
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              {named.map((s) => (
                <div key={s.id} className="card" style={{ padding: 14, display: "flex", gap: 12 }}>
                  {s.photo_path && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photoThumb(s.photo_path, 120)}
                      alt=""
                      style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 0, border: "2px solid var(--text)" }}
                    />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div className="type-md">{s.name}</div>
                      <SunflowerFilmButton sunflowerId={s.id} title={s.name ?? "Slunečnice"} />
                    </div>
                    {s.message && (
                      <p className="type-body" style={{ marginTop: 2 }}>
                        {s.message}
                      </p>
                    )}
                    {s.web_consent && s.named_by && (
                      <div className="type-label" style={{ color: "var(--muted)", marginTop: 4 }}>
                        — {s.named_by}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Watering history */}
        {waterings.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <h2 className="type-md" style={{ marginBottom: 12 }}>
              Historie zálivek
            </h2>
            <div style={{ display: "grid", gap: 6 }}>
              {waterings.slice(0, 20).map((w) => {
                const d = daysSince(w.watered_at);
                return (
                  <div
                    key={w.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 12px",
                      border: "2px solid var(--text)",
                      borderRadius: 0,
                      background: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <span> {w.watered_by || "Anonym"}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {d === 0 ? "dnes" : d === 1 ? "včera" : `před ${d} dny`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
