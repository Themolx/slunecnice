"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { logWatering, uploadBlob, updateSpot } from "@/lib/data";
import { distanceMetres, WATERING_RADIUS_M, GPS_VERIFY, WATERING_COOLDOWN_H, hoursSince } from "@/lib/supabase";
import { getGardener, setGardener, POINTS_WATER } from "@/lib/gardener";
import { success, tap } from "@/lib/haptics";
import CameraCapture from "@/components/CameraCapture";

type Step = "panel" | "askName" | "locating" | "tooFar" | "gpsError" | "camera" | "done";

export default function SpotActions({
  spotId,
  spotLat,
  spotLon,
  initialPhotos,
  lastWateredAt,
}: {
  spotId: string;
  spotLat: number;
  spotLon: number;
  initialPhotos: string[];
  lastWateredAt: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("panel");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);

  const [gardener, setG] = useState(() => getGardener());
  const [nameInput, setNameInput] = useState(() => getGardener());

  const close = () => {
    setStep("panel");
    setError(null);
  };

  const startWatering = () => {
    tap();
    setError(null);
    if (!gardener.trim()) {
      setStep("askName");
      return;
    }
    beginLocate();
  };

  const confirmName = () => {
    const n = nameInput.trim();
    if (!n) {
      setError("Napiš si přezdívku");
      return;
    }
    setGardener(n);
    setG(n);
    setError(null);
    beginLocate();
  };

  const beginLocate = () => {
    if (!GPS_VERIFY) {
      setStep("camera");
      return;
    }
    if (!navigator.geolocation) {
      setStep("gpsError");
      setError("Tvůj prohlížeč neumí zjistit polohu.");
      return;
    }
    setStep("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = distanceMetres({ lat: pos.coords.latitude, lon: pos.coords.longitude }, { lat: spotLat, lon: spotLon });
        setDistance(Math.round(d));
        setStep(d > WATERING_RADIUS_M ? "tooFar" : "camera");
      },
      (err) => {
        setStep("gpsError");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Bez přístupu k poloze nejde ověřit, že jsi u slunečnice. Povol polohu a zkus to znovu."
            : `Polohu se nepodařilo zjistit: ${err.message}`
        );
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const onCapture = async (blob: Blob) => {
    setBusy(true);
    setError(null);
    try {
      const path = await uploadBlob(blob, `spots/${spotId}`);
      const nextPhotos = [...photos, path];
      await logWatering({ spot_id: spotId, watered_by: gardener || undefined, photo_path: path });
      await updateSpot(spotId, { photo_paths: nextPhotos });
      setPhotos(nextPhotos);
      router.refresh();
      success();
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uložení selhalo");
      setStep("gpsError");
    } finally {
      setBusy(false);
    }
  };

  const Header = ({ title, sub }: { title: string; sub?: string }) => (
    <div style={{ marginBottom: 16 }}>
      <div className="type-lg" style={{ fontSize: 28 }}>{title}</div>
      {sub && <p className="type-body" style={{ marginTop: 6, color: "var(--muted)" }}>{sub}</p>}
    </div>
  );

  const ErrorBox = () =>
    error ? (
      <div style={{ border: "3px solid #C0392B", borderRadius: "var(--radius-sm)", color: "#C0392B", padding: "10px 12px", marginTop: 12, fontWeight: 700, fontSize: 13 }}>
        {error}
      </div>
    ) : null;

  return (
    <>
      {/* inline trigger on the page */}
      {(() => {
        const since = hoursSince(lastWateredAt);
        const onCooldown = since !== null && since < WATERING_COOLDOWN_H;
        const remaining = since === null ? 0 : Math.ceil(WATERING_COOLDOWN_H - since);
        return (
          <div className="card" style={{ padding: 18 }}>
            {onCooldown ? (
              <>
                <button className="btn" style={{ width: "100%", fontSize: 16, padding: "16px 20px", opacity: 0.55, cursor: "not-allowed", background: "#eee" }} disabled>
                  Dnes už zalitá
                </button>
                <p className="type-label" style={{ color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
                  Tahle slunečnice má vodu. Vrať se za {remaining} h · nebo zalij jinou žíznivou na mapě.
                </p>
              </>
            ) : (
              <>
                <button className="btn btn-leaf" style={{ width: "100%", fontSize: 16, padding: "16px 20px" }} onClick={startWatering}>
                  {GPS_VERIFY ? "Zalít · ověříme polohu" : "Zalít a vyfotit"}
                </button>
                <p className="type-label" style={{ color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
                  {GPS_VERIFY ? `Jen do ${WATERING_RADIUS_M} m · ` : ""}za zálivku {POINTS_WATER} bodů
                </p>
              </>
            )}
          </div>
        );
      })()}

      {/* full-screen flow */}
      {step !== "panel" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "3px solid var(--text)" }}>
            <span className="type-md">Zalít slunečnici</span>
            <button
              onClick={close}
              aria-label="Zavřít"
              style={{ width: 38, height: 38, background: "#fff", border: "3px solid var(--text)", borderRadius: "var(--radius-sm)", fontWeight: 900, fontSize: 16, cursor: "pointer", lineHeight: 1 }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", padding: 18, flex: 1, display: "flex", flexDirection: "column", justifyContent: step === "camera" ? "flex-start" : "center" }}>

              {step === "askName" && (
                <div className="anim-slideup">
                  <Header title="Jak ti říkat?" sub="Tvoje přezdívka v žebříčku zahradníků. Stačí jednou." />
                  <input className="field" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="např. Tonda" autoFocus onKeyDown={(e) => e.key === "Enter" && confirmName()} />
                  <ErrorBox />
                  <button className="btn btn-leaf" style={{ width: "100%", marginTop: 16 }} onClick={confirmName}>Pokračovat</button>
                </div>
              )}

              {step === "locating" && (
                <div style={{ textAlign: "center" }}>
                  <div className="anim-locating" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--leaf)", margin: "0 auto 16px" }} />
                  <div className="type-md">Ověřuju polohu…</div>
                  <p className="type-body" style={{ color: "var(--muted)", marginTop: 6 }}>Drž telefon u slunečnice.</p>
                </div>
              )}

              {step === "tooFar" && (
                <div>
                  <Header title="Jsi moc daleko" sub={`Jsi asi ${distance} m od slunečnice. Přijď blíž (do ${WATERING_RADIUS_M} m).`} />
                  <button className="btn btn-leaf" style={{ width: "100%" }} onClick={beginLocate}>Zkusit znovu</button>
                </div>
              )}

              {step === "gpsError" && (
                <div>
                  <Header title="Něco se nepovedlo" />
                  <ErrorBox />
                  <button className="btn btn-leaf" style={{ width: "100%", marginTop: 14 }} onClick={beginLocate}>Zkusit znovu</button>
                </div>
              )}

              {step === "camera" && (
                <div className="anim-slideup">
                  <Header title="Vyfoť slunečnici" sub="Zalij ji a cvakni fotku." />
                  <CameraCapture onCapture={onCapture} onCancel={close} hint={busy ? "Ukládám snímek…" : undefined} />
                </div>
              )}

              {step === "done" && (
                <div style={{ textAlign: "center" }} className="anim-slideup">
                  <div className="anim-pop" style={{ width: 64, height: 64, borderRadius: 18, background: "var(--leaf)", color: "#fff", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900 }}>
                    +{POINTS_WATER}
                  </div>
                  <div className="type-lg" style={{ color: "var(--leaf)" }}>Zaléváno a vyfoceno</div>
                  <p className="type-body" style={{ marginTop: 8, marginBottom: 18 }}>Díky, žes přišel. Vrať se zase zalít.</p>
                  <button className="btn btn-sun" style={{ width: "100%" }} onClick={close}>Hotovo</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
