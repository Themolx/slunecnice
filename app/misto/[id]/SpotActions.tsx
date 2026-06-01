"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logWatering, uploadBlob, fetchSpotFrames, type Frame } from "@/lib/data";
import { distanceMetres, WATERING_RADIUS_M, GPS_VERIFY, photoThumb } from "@/lib/supabase";
import { getGardener, setGardener, POINTS_WATER } from "@/lib/gardener";
import CameraCapture from "@/components/CameraCapture";
import FilmPlayer from "@/components/FilmPlayer";

type Step = "panel" | "askName" | "locating" | "tooFar" | "gpsError" | "camera" | "done";

export default function SpotActions({
  spotId,
  spotLat,
  spotLon,
}: {
  spotId: string;
  spotLat: number;
  spotLon: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("panel");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const [gardener, setG] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [onionUrl, setOnionUrl] = useState<string | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [showFilm, setShowFilm] = useState(false);

  useEffect(() => {
    const g = getGardener();
    setG(g);
    setNameInput(g);
    fetchSpotFrames(spotId)
      .then((f) => {
        setFrames(f);
        const last = f[f.length - 1];
        setOnionUrl(last ? photoThumb(last.photo_path, 640) : null);
      })
      .catch(() => {});
  }, [spotId]);

  const startWatering = () => {
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
      const path = await uploadBlob(blob, `frames/${spotId}`);
      await logWatering({ spot_id: spotId, watered_by: gardener || undefined, photo_path: path });
      const f = await fetchSpotFrames(spotId);
      setFrames(f);
      router.refresh();
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uložení selhalo");
      setStep("panel");
    } finally {
      setBusy(false);
    }
  };

  const Header = ({ title, sub }: { title: string; sub?: string }) => (
    <div style={{ marginBottom: 14 }}>
      <div className="type-md">{title}</div>
      {sub && <p className="type-body" style={{ marginTop: 4, color: "var(--muted)" }}>{sub}</p>}
    </div>
  );

  const ErrorBox = () =>
    error ? (
      <div style={{ border: "3px solid #C0392B", borderRadius: "var(--radius-sm)", color: "#C0392B", padding: "10px 12px", marginTop: 12, fontWeight: 700, fontSize: 13 }}>
        {error}
      </div>
    ) : null;

  return (
    <div className="card" style={{ padding: 18 }}>
      {step === "panel" && (
        <>
          <button className="btn btn-leaf" style={{ width: "100%", fontSize: 16, padding: "16px 20px" }} onClick={startWatering}>
            {GPS_VERIFY ? "Zalít · ověříme polohu" : "Zalít a vyfotit"}
          </button>
          <p className="type-label" style={{ color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
            {GPS_VERIFY ? `Jen do ${WATERING_RADIUS_M} m · ` : ""}za zálivku {POINTS_WATER} bodů
          </p>
          {frames.length > 0 && (
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setShowFilm(true)}>
              Přehrát film ({frames.length})
            </button>
          )}
        </>
      )}

      {step === "askName" && (
        <div className="anim-slideup">
          <Header title="Jak ti říkat?" sub="Tvoje přezdívka v žebříčku zahradníků. Stačí jednou." />
          <input
            className="field"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="např. Tonda"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && confirmName()}
          />
          <ErrorBox />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep("panel")}>Zpět</button>
            <button className="btn btn-leaf" style={{ flex: 1.4 }} onClick={confirmName}>Pokračovat</button>
          </div>
        </div>
      )}

      {step === "locating" && (
        <div style={{ textAlign: "center", padding: "18px 0" }}>
          <div className="anim-locating" style={{ width: 34, height: 34, borderRadius: 10, background: "var(--leaf)", margin: "0 auto 16px" }} />
          <div className="type-md">Ověřuju polohu…</div>
        </div>
      )}

      {step === "tooFar" && (
        <>
          <Header title="Jsi moc daleko" sub={`Jsi asi ${distance} m od slunečnice. Přijď blíž (do ${WATERING_RADIUS_M} m).`} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep("panel")}>Zpět</button>
            <button className="btn btn-leaf" style={{ flex: 1.4 }} onClick={beginLocate}>Zkusit znovu</button>
          </div>
        </>
      )}

      {step === "gpsError" && (
        <>
          <Header title="Nepovedlo se ověřit polohu" />
          <ErrorBox />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep("panel")}>Zpět</button>
            <button className="btn btn-leaf" style={{ flex: 1.4 }} onClick={beginLocate}>Zkusit znovu</button>
          </div>
        </>
      )}

      {step === "camera" && (
        <div className="anim-slideup">
          <Header
            title="Vyfoť slunečnici"
            sub={onionUrl ? "Polož ji přes minulou fotku (onion skin), ať film plyne." : "První snímek jejího filmu."}
          />
          <CameraCapture onionUrl={onionUrl} onCapture={onCapture} onCancel={() => setStep("panel")} hint={busy ? "Ukládám snímek…" : undefined} />
        </div>
      )}

      {step === "done" && (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div className="anim-pop" style={{ width: 56, height: 56, borderRadius: 16, background: "var(--leaf)", color: "#fff", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900 }}>
            +{POINTS_WATER}
          </div>
          <div className="type-lg" style={{ color: "var(--leaf)" }}>Zaléváno a vyfoceno</div>
          <p className="type-body" style={{ marginTop: 6, marginBottom: 14 }}>
            Film má teď {frames.length} {frames.length === 1 ? "snímek" : frames.length < 5 ? "snímky" : "snímků"}.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {frames.length > 0 && <button className="btn btn-sun" onClick={() => setShowFilm(true)}>Přehrát film</button>}
            <button className="btn btn-ghost" onClick={() => { setStep("panel"); setError(null); }}>Hotovo</button>
          </div>
        </div>
      )}

      {showFilm && <FilmPlayer title="Slunečnice" frames={frames} onClose={() => setShowFilm(false)} />}
    </div>
  );
}
