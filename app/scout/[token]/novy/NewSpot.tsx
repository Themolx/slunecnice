"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSpot, uploadPhoto } from "@/lib/data";
import type { SpotKind, WaterType } from "@/lib/supabase";
import { WATER_LABELS } from "@/lib/supabase";

export default function NewSpot({ token, defaultKind = "planting" }: { token: string; defaultKind?: SpotKind }) {
  const router = useRouter();
  const [kind, setKind] = useState<SpotKind>(defaultKind);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [waterType, setWaterType] = useState<WaterType>("tap");
  const [count, setCount] = useState("");
  const [notes, setNotes] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolokace není dostupná");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        setError(`Geolokace selhala: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const latN = parseFloat(lat);
    const lonN = parseFloat(lon);
    if (isNaN(latN) || isNaN(lonN)) {
      setError("Doplň GPS (nebo „Použít mou polohu“)");
      return;
    }
    setSaving(true);
    try {
      const photo_paths: string[] = [];
      for (const f of files) {
        photo_paths.push(await uploadPhoto(f, `spots/${kind}`));
      }
      const spot = await createSpot({
        kind,
        name: name.trim(),
        lat: latN,
        lon: lonN,
        water_type: kind === "water" ? waterType : null,
        sunflower_count: kind === "planting" && count ? parseInt(count) : 0,
        status: kind === "planting" && count ? "zasazeno" : undefined,
        notes: notes.trim(),
        created_by: createdBy.trim(),
        photo_paths,
      });
      router.push(`/scout/${token}/${spot.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vytvoření selhalo");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ padding: 16, paddingBottom: 110, maxWidth: 620, margin: "0 auto" }}>
      {/* Kind toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`btn ${kind === "planting" ? "btn-sun" : "btn-ghost"}`}
          style={{ flex: 1 }}
          onClick={() => setKind("planting")}
        >
           Sázení
        </button>
        <button
          type="button"
          className={`btn ${kind === "water" ? "btn-leaf" : "btn-ghost"}`}
          style={{ flex: 1 }}
          onClick={() => setKind("water")}
        >
           Voda
        </button>
      </div>

      <Field label="Název místa">
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === "water" ? "např. Pítko u parku" : "např. U lavičky na Folimance"}
          autoFocus
        />
      </Field>

      {/* GPS */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="type-label" style={{ color: "var(--muted)" }}>
            GPS souřadnice
          </span>
          <button type="button" className="btn btn-leaf" style={{ padding: "8px 12px", fontSize: 11 }} onClick={useMyLocation} disabled={locating}>
            {locating ? "Hledám…" : "Použít mou polohu"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input className="field" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value.replace(/[^0-9.\-]/g, ""))} placeholder="50.06" style={{ fontFamily: "monospace" }} />
          <input className="field" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value.replace(/[^0-9.\-]/g, ""))} placeholder="14.42" style={{ fontFamily: "monospace" }} />
        </div>
      </div>

      {kind === "water" ? (
        <Field label="Typ zdroje">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Object.keys(WATER_LABELS) as WaterType[]).map((w) => (
              <button key={w} type="button" className={`pill ${waterType === w ? "" : ""}`} style={{ cursor: "pointer", background: waterType === w ? "var(--leaf)" : "#fff", color: waterType === w ? "#fff" : "var(--text)", borderColor: "var(--leaf)" }} onClick={() => setWaterType(w)}>
                {WATER_LABELS[w]}
              </button>
            ))}
          </div>
        </Field>
      ) : (
        <Field label="Počet zasazených slunečnic (nepovinné, lze i v sázení)">
          <input className="field" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="např. 12" />
        </Field>
      )}

      <Field label="Tvoje jméno (skaut)">
        <input className="field" value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} placeholder="kdo zakládá" />
      </Field>

      <Field label="Poznámky">
        <textarea className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="slunce, půda, přístup k vodě…" />
      </Field>

      <Field label="Fotky">
        <input type="file" accept="image/*" capture="environment" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} style={{ fontSize: 13 }} />
        {files.length > 0 && (
          <div className="type-label" style={{ color: "var(--muted)", marginTop: 6 }}>
            {files.length} fotek vybráno
          </div>
        )}
      </Field>

      {error && (
        <div style={{ border: "3px solid #C0392B", color: "#C0392B", borderRadius: 0, padding: 12, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 12, background: "var(--text)", borderTop: "4px solid var(--sun)", display: "flex", gap: 8 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1, color: "#fff", borderColor: "#fff" }} onClick={() => router.push(`/scout/${token}`)}>
          Zrušit
        </button>
        <button type="submit" className="btn btn-sun" style={{ flex: 1.5 }} disabled={saving}>
          {saving ? "Vytvářím…" : "Vytvořit →"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="type-label" style={{ color: "var(--muted)", marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
