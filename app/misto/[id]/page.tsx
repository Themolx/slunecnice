import Link from "next/link";
import { notFound } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import type { Metadata } from "next";
import SpotActions from "./SpotActions";
import PhotoGallery from "@/components/PhotoGallery";
import { fetchSpot, fetchWaterings } from "@/lib/data";
import { photoUrl, photoThumb, STATUS_LABELS, WATER_LABELS, daysSince, drynessColor, czDaysAgo } from "@/lib/supabase";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const spot = await fetchSpot(id).catch(() => null);
  if (!spot) return { title: "Místo nenalezeno" };
  const name = spot.name || (spot.kind === "water" ? "Zdroj vody" : "Slunečnice");
  const desc =
    spot.kind === "water"
      ? `Zdroj vody „${name}" na mapě Slunečnice — kde nabrat vodu na zálivku.`
      : `Slunečnice „${name}" na živé mapě. Zalij ji, vyfoť a starej se o ni.`;
  const img = spot.photo_paths.length ? photoUrl(spot.photo_paths[spot.photo_paths.length - 1]) : undefined;
  return {
    title: name,
    description: desc,
    alternates: { canonical: `/misto/${id}` },
    openGraph: {
      title: `${name} · Slunečnice`,
      description: desc,
      images: img ? [{ url: img }] : undefined,
    },
  };
}

export default async function SpotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spot = await fetchSpot(id);
  if (!spot) notFound();

  const waterings = await fetchWaterings(id);
  const lastWatered = waterings[0]?.watered_at ?? null;
  const days = daysSince(lastWatered);
  const isWater = spot.kind === "water";
  // Only really-planted sunflowers can be watered. Scouted candidates
  // (navrzeno/vhodne) and gone ones (zaniklo) cannot.
  const isPlanted = !isWater && (spot.status === "zasazeno" || spot.status === "kvete");

  // Gallery = crew/scout photos (newest first). If a spot has no scout photo,
  // fall back to its watering photos so the hero isn't empty.
  const photos =
    spot.photo_paths.length > 0
      ? [...spot.photo_paths].reverse()
      : waterings.filter((w) => w.photo_path).map((w) => w.photo_path as string);

  const spotName = spot.name || (isWater ? "Zdroj vody" : "Slunečnice");
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mapa", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: spotName, item: `${SITE_URL}/misto/${id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PublicNav />
      <div className="anim-blurin" style={{ maxWidth: 620, margin: "0 auto", width: "100%", padding: "16px 18px 60px" }}>
        <Link href="/" className="type-label" style={{ color: "var(--muted)", textDecoration: "none" }}>
          ← Zpět na mapu
        </Link>

        {/* Photos (hero + grid + lightbox) */}
        <div style={{ marginTop: 14 }}>
          <PhotoGallery photos={photos} />
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
                {days === null ? "Ještě nezaléváno" : `Zaléváno ${czDaysAgo(days)}`}
              </span>
            </>
          )}
        </div>

        {spot.notes && <p className="type-body" style={{ marginTop: 14 }}>{spot.notes}</p>}

        {/* Action — only for really-planted sunflowers */}
        {isPlanted && (
          <div style={{ marginTop: 18 }}>
            <SpotActions spotId={spot.id} spotLat={spot.lat} spotLon={spot.lon} />
          </div>
        )}
        {!isWater && !isPlanted && (
          <div className="card" style={{ marginTop: 18, padding: 16, textAlign: "center" }}>
            <div className="type-label" style={{ color: "var(--muted)" }}>
              {spot.status === "zaniklo" ? "Tahle slunečnice už tu není." : "Tohle místo je zatím jen navržené — slunečnice tu ještě není zasazená."}
            </div>
          </div>
        )}

        {/* Watering history */}
        {waterings.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 className="type-label" style={{ color: "var(--muted)", marginBottom: 10 }}>Historie zálivek</h2>
            <div style={{ display: "grid", gap: 6 }}>
              {waterings.slice(0, 20).map((w) => {
                const d = daysSince(w.watered_at);
                return (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 12px", border: "2px solid var(--text)", borderRadius: "var(--radius-sm)", background: "#fff", fontSize: 13, fontWeight: 600 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      {w.photo_path && (
                        <a href={photoUrl(w.photo_path)} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoThumb(w.photo_path, 80)} alt="" style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 6, border: "2px solid var(--text)", display: "block" }} />
                        </a>
                      )}
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.watered_by || "Anonym"}</span>
                    </span>
                    <span style={{ color: "var(--muted)", flexShrink: 0 }}>{czDaysAgo(d)}</span>
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
