"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSpot, uploadBlob } from "@/lib/data";
import { getGardener } from "@/lib/gardener";
import { success, tap } from "@/lib/haptics";
import CameraCapture from "@/components/CameraCapture";
import { WATER_LABELS, type SpotKind, type WaterType } from "@/lib/supabase";

type Step = "camera" | "details" | "done";

export default function ScoutCapture({ token }: { token: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("camera");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsErr, setGpsErr] = useState<string | null>(null);
  const [kind, setKind] = useState<SpotKind>("planting");
  const [waterType, setWaterType] = useState<WaterType>("tap");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const previewRef = useRef<string | null>(null);

  const locate = () => {
    setGpsErr(null);
    if (!navigator.geolocation) {
      setGpsErr("Geolokace není dostupná");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => setGpsErr(e.message),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };
  useEffect(() => {
    locate();
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const onCapture = async (blob: Blob) => {
    setBusy(true);
    setError(null);
    try {
      const path = await uploadBlob(blob, "scout");
      setPhotoPath(path);
      const url = URL.createObjectURL(blob);
      previewRef.current = url;
      setPreview(url);
      if (!coords) locate();
      setStep("details");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nahrání selhalo");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!coords) {
      setError("Chybí poloha. Dej „Zkusit polohu znovu“.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createSpot({
        kind,
        name: name.trim(),
        lat: coords.lat,
        lon: coords.lon,
        status: kind === "planting" ? "navrzeno" : "vhodne",
        water_type: kind === "water" ? waterType : null,
        notes: note.trim(),
        created_by: getGardener() || undefined,
        photo_paths: photoPath ? [photoPath] : [],
      });
      success();
      setCount((c) => c + 1);
      router.refresh();
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uložení selhalo");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPhotoPath(null);
    setPreview(null);
    setName("");
    setNote("");
    setKind("planting");
    setError(null);
    setStep("camera");
    locate();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "3px solid var(--text)" }}>
        <span className="type-md">Scoutnout místo {count > 0 ? `· ${count}` : ""}</span>
        <button
          onClick={() => router.push(`/scout/${token}`)}
          aria-label="Zavřít"
          style={{ width: 38, height: 38, background: "#fff", border: "3px solid var(--text)", borderRadius: "var(--radius-sm)", fontWeight: 900, fontSize: 16, cursor: "pointer", lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
          {step === "camera" && (
            <div className="anim-slideup">
              <div className="type-lg" style={{ fontSize: 26, marginBottom: 6 }}>Vyfoť místo</div>
              <p className="type-body" style={{ color: "var(--muted)", marginBottom: 14 }}>
                {gpsErr ? "Poloha se hledá…" : coords ? "Poloha zachycena ✓ Vyfoť kandidáta na slunečnici." : "Hledám polohu… mezitím vyfoť místo."}
              </p>
              <CameraCapture onCapture={onCapture} onCancel={() => router.push(`/scout/${token}`)} hint={busy ? "Nahrávám…" : undefined} />
            </div>
          )}

          {step === "details" && (
            <div className="anim-slideup">
              {preview && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={preview} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "var(--radius)", border: "3px solid var(--text)" }} />
              )}

              {/* type toggle */}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className={`btn ${kind === "planting" ? "btn-sun" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => { setKind("planting"); tap(); }}>
                  Slunečnice
                </button>
                <button className={`btn ${kind === "water" ? "btn-leaf" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => { setKind("water"); tap(); }}>
                  Voda
                </button>
              </div>

              {/* GPS status */}
              <div style={{ marginTop: 14, padding: "10px 12px", border: "2px solid var(--text)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span className="type-label" style={{ color: coords ? "var(--leaf)" : "#C0392B" }}>
                  {coords ? `Poloha ✓ ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}` : gpsErr ? "Poloha selhala" : "Hledám polohu…"}
                </span>
                {!coords && (
                  <button className="pill" style={{ cursor: "pointer" }} onClick={locate}>Zkusit znovu</button>
                )}
              </div>

              {kind === "water" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {(Object.keys(WATER_LABELS) as WaterType[]).map((w) => (
                    <button key={w} className="pill" style={{ cursor: "pointer", background: waterType === w ? "var(--leaf)" : "#fff", color: waterType === w ? "#fff" : "var(--text)", borderColor: "var(--leaf)" }} onClick={() => setWaterType(w)}>
                      {WATER_LABELS[w]}
                    </button>
                  ))}
                </div>
              )}

              <label className="type-label" style={{ display: "block", margin: "16px 0 6px", color: "var(--muted)" }}>Název (nepovinné)</label>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "water" ? "např. Pítko u parku" : "např. U lavičky na Folimance"} />

              <label className="type-label" style={{ display: "block", margin: "14px 0 6px", color: "var(--muted)" }}>Poznámka</label>
              <textarea className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="slunce, půda, přístup k vodě, kolik se vejde…" />

              {error && (
                <div style={{ border: "3px solid #C0392B", borderRadius: "var(--radius-sm)", color: "#C0392B", padding: "10px 12px", marginTop: 12, fontWeight: 700, fontSize: 13 }}>{error}</div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={reset} disabled={busy}>Přefotit</button>
                <button className="btn btn-sun" style={{ flex: 1.6 }} onClick={save} disabled={busy}>{busy ? "Ukládám…" : "Uložit místo"}</button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="anim-slideup" style={{ textAlign: "center", paddingTop: 24 }}>
              <div className="anim-pop" style={{ width: 64, height: 64, borderRadius: 18, background: "var(--leaf)", color: "#fff", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900 }}>✓</div>
              <div className="type-lg" style={{ color: "var(--leaf)" }}>Místo uloženo</div>
              <p className="type-body" style={{ marginTop: 8, marginBottom: 20 }}>
                Kandidát je v mapě Zahradníků (zatím se veřejně nezobrazuje). Scoutnul jsi {count} {count === 1 ? "místo" : count < 5 ? "místa" : "míst"}.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button className="btn btn-sun" onClick={reset}>Scoutnout další</button>
                <button className="btn btn-ghost" onClick={() => router.push(`/scout/${token}`)}>Hotovo</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
