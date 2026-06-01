import Link from "next/link";
import { notFound } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import SpotActions from "./SpotActions";
import { fetchSpot, fetchWaterings } from "@/lib/data";
import { photoThumb, photoUrl, STATUS_LABELS, WATER_LABELS, daysSince, drynessColor } from "@/lib/supabase";

export const revalidate = 30;

export default async function SpotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spot = await fetchSpot(id);
  if (!spot) notFound();

  const waterings = await fetchWaterings(id);
  const lastWatered = waterings[0]?.watered_at ?? null;
  const days = daysSince(lastWatered);
  const isWater = spot.kind === "water";

  // Newest photo first for the hero.
  const photos = [...spot.photo_paths].reverse();

  return (
    <>
      <PublicNav />
      <div style={{ maxWidth: 620, margin: "0 auto", width: "100%", padding: "16px 18px 60px" }}>
        <Link href="/" className="type-label" style={{ color: "var(--muted)", textDecoration: "none" }}>
          ← Zpět na mapu
        </Link>

        {/* Hero photo */}
        <div style={{ marginTop: 14, borderRadius: "var(--radius)", overflow: "hidden", border: "3px solid var(--text)", aspectRatio: "1 / 1", background: "#efece2" }}>
          {photos[0] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photoThumb(photos[0], 800)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div className="type-label" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
              Bez fotky
            </div>
          )}
        </div>

        {/* Title + meta */}
        <h1 className="type-lg" style={{ marginTop: 16 }}>
          {spot.name || (isWater ? "Zdroj vody" : "Slunečnice")}
        </h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {isWater ? (
            <span className="pill" style={{ borderColor: "var(--leaf)", color: "var(--leaf)" }}>
              {spot.water_type ? WATER_LABELS[spot.water_type] : "Voda"}
            </span>
          ) : (
            <>
              <span className="pill">{STATUS_LABELS[spot.status]}</span>
              <span className="pill" style={{ borderColor: drynessColor(days), color: drynessColor(days) }}>
                {days === null ? "Ještě nezaléváno" : days === 0 ? "Zaléváno dnes" : `Zaléváno před ${days} dny`}
              </span>
            </>
          )}
        </div>

        {spot.notes && <p className="type-body" style={{ marginTop: 14 }}>{spot.notes}</p>}

        {/* Action */}
        {!isWater && (
          <div style={{ marginTop: 18 }}>
            <SpotActions spotId={spot.id} spotLat={spot.lat} spotLon={spot.lon} />
          </div>
        )}

        {/* Extra photos */}
        {photos.length > 1 && (
          <section style={{ marginTop: 24 }}>
            <h2 className="type-label" style={{ color: "var(--muted)", marginBottom: 10 }}>Snímky filmu</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
              {photos.map((p) => (
                <a key={p} href={photoUrl(p)} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoThumb(p, 200)} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "2px solid var(--text)" }} />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Watering history */}
        {waterings.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 className="type-label" style={{ color: "var(--muted)", marginBottom: 10 }}>Historie zálivek</h2>
            <div style={{ display: "grid", gap: 6 }}>
              {waterings.slice(0, 20).map((w) => {
                const d = daysSince(w.watered_at);
                return (
                  <div key={w.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 12px", border: "2px solid var(--text)", borderRadius: "var(--radius-sm)", background: "#fff", fontSize: 13, fontWeight: 600 }}>
                    <span>{w.watered_by || "Anonym"}</span>
                    <span style={{ color: "var(--muted)" }}>{d === 0 ? "dnes" : d === 1 ? "včera" : `před ${d} dny`}</span>
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
