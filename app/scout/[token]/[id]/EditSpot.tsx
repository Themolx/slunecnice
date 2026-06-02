"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSpot, uploadPhoto, deleteSpot } from "@/lib/data";
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
  const [notes, setNotes] = useState(spot.notes ?? "");
  const [photos, setPhotos] = useState<string[]>(spot.photo_paths);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWater = spot.kind === "water";
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!confirm("Smazat tohle místo? Nelze vrátit.")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteSpot(spot.id);
      router.push(`/scout/${token}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Smazání selhalo");
      setDeleting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateSpot(spot.id, {
        name: name.trim() || null,
        status,
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
            <p className="type-label" style={{ color: "var(--muted)", marginTop: 8, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>
              Navrženo / Vhodné = kandidát (jen tady, veřejně skrytý). Zasazeno / Kvete = veřejně viditelné a zalévatelné.
            </p>
          </Field>
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

      <button type="button" className="btn btn-ghost" style={{ width: "100%", color: "#C0392B", borderColor: "#C0392B" }} onClick={remove} disabled={deleting}>
        {deleting ? "Mažu…" : "Smazat místo"}
      </button>

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
