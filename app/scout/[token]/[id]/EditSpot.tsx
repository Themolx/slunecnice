"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSpot, logPlanting, uploadPhoto } from "@/lib/data";
import {
  STATUS_LABELS,
  photoThumb,
  type Spot,
  type SpotStatus,
} from "@/lib/supabase";

const STATUSES: SpotStatus[] = ["navrzeno", "vhodne", "zasazeno", "kvete", "zaniklo"];

export default function EditSpot({ token, spot }: { token: string; spot: Spot }) {
  const router = useRouter();
  const [name, setName] = useState(spot.name ?? "");
  const [status, setStatus] = useState<SpotStatus>(spot.status);
  const [count, setCount] = useState(String(spot.sunflower_count || ""));
  const [notes, setNotes] = useState(spot.notes ?? "");
  const [photos, setPhotos] = useState<string[]>(spot.photo_paths);
  const [saving, setSaving] = useState(false);
  const [planting, setPlanting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWater = spot.kind === "water";

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateSpot(spot.id, {
        name: name.trim() || null,
        status,
        sunflower_count: count ? parseInt(count) : 0,
        notes: notes.trim() || null,
        photo_paths: photos,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uložení selhalo");
    } finally {
      setSaving(false);
    }
  };

  const plant = async () => {
    const n = parseInt(count);
    if (!n || n < 1) {
      setError("Zadej počet slunečnic");
      return;
    }
    setPlanting(true);
    setError(null);
    try {
      await logPlanting(spot.id, n);
      setStatus("zasazeno");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sázení selhalo");
    } finally {
      setPlanting(false);
    }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setSaving(true);
    try {
      const added: string[] = [];
      for (const f of Array.from(files)) added.push(await uploadPhoto(f, `spots/${spot.kind}`));
      const next = [...photos, ...added];
      setPhotos(next);
      await updateSpot(spot.id, { photo_paths: next });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nahrání selhalo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16, paddingBottom: 110, maxWidth: 620, margin: "0 auto" }}>
      <Field label="Název">
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      {!isWater && (
        <>
          <Field label="Status">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STATUSES.map((s) => (
                <button key={s} type="button" className="pill" style={{ cursor: "pointer", background: status === s ? "var(--sun)" : "#fff" }} onClick={() => setStatus(s)}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Počet slunečnic">
            <input className="field" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="12" />
          </Field>

          {/* Plant action: generates the sunflower slots */}
          <button type="button" className="btn btn-ink" style={{ width: "100%", marginBottom: 18 }} onClick={plant} disabled={planting}>
            {planting ? "Sázím…" : "Zaznamenat sázení (vytvoří sloty)"}
          </button>
        </>
      )}

      <Field label="Poznámky">
        <textarea className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <Field label="Fotky">
        {photos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8, marginBottom: 8 }}>
            {photos.map((p) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={p} src={photoThumb(p, 180)} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 0, border: "2px solid var(--text)" }} />
            ))}
          </div>
        )}
        <input type="file" accept="image/*" capture="environment" multiple onChange={(e) => addPhotos(e.target.files)} style={{ fontSize: 13 }} />
      </Field>

      {error && (
        <div style={{ border: "3px solid #C0392B", color: "#C0392B", borderRadius: 0, padding: 12, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 12, background: "var(--text)", borderTop: "4px solid var(--sun)", display: "flex", gap: 8 }}>
        <a href={`/misto/${spot.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ flex: 1, color: "#fff", borderColor: "#fff" }}>
          Veřejný náhled
        </a>
        <button type="button" className="btn btn-sun" style={{ flex: 1.4 }} onClick={save} disabled={saving}>
          {saving ? "Ukládám…" : "Uložit"}
        </button>
      </div>
    </div>
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
