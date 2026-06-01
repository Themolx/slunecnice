"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  logWatering,
  nameSunflowerById,
  uploadBlob,
  fetchSunflowerFrames,
  type Frame,
} from "@/lib/data";
import { distanceMetres, WATERING_RADIUS_M, GPS_VERIFY, photoThumb } from "@/lib/supabase";
import { getGardener, setGardener, POINTS_WATER, POINTS_NAME } from "@/lib/gardener";
import CameraCapture from "@/components/CameraCapture";
import FilmPlayer from "@/components/FilmPlayer";

export interface Slot {
  id: string;
  index: number;
  name: string | null;
}

type Step =
  | "panel"
  | "askName"
  | "locating"
  | "tooFar"
  | "gpsError"
  | "pickSlot"
  | "camera"
  | "naming"
  | "done";

export default function SpotActions({
  spotId,
  spotLat,
  spotLon,
  slots,
}: {
  spotId: string;
  spotLat: number;
  spotLon: number;
  slots: Slot[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("panel");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // gardener identity (leaderboard handle)
  const [gardener, setG] = useState("");
  const [nameInput, setNameInput] = useState("");
  useEffect(() => {
    const g = getGardener();
    setG(g);
    setBy(g);
    setNameInput(g);
  }, []);

  // selection + capture
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [onionUrl, setOnionUrl] = useState<string | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [showFilm, setShowFilm] = useState(false);

  // naming fields
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [by, setBy] = useState("");
  const [consent, setConsent] = useState(false);

  const selectedSlot = slots.find((s) => s.id === selectedId) ?? null;
  const freeSlots = slots.filter((s) => !s.name);
  const namedCount = slots.length - freeSlots.length;

  // ── 1. Gardener handle ────────────────────────────────────────────────────
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
    setBy(n);
    setError(null);
    beginLocate();
  };

  // ── 2. GPS proximity ──────────────────────────────────────────────────────
  const beginLocate = () => {
    if (!GPS_VERIFY) {
      // Proximity gate disabled — skip straight to picking a sunflower.
      setStep("pickSlot");
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
        const d = distanceMetres(
          { lat: pos.coords.latitude, lon: pos.coords.longitude },
          { lat: spotLat, lon: spotLon }
        );
        setDistance(Math.round(d));
        setStep(d > WATERING_RADIUS_M ? "tooFar" : "pickSlot");
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

  // ── 3. Pick which sunflower, load its onion skin ──────────────────────────
  const pickSunflower = async (id: string) => {
    setSelectedId(id);
    setError(null);
    setStep("camera");
    try {
      const f = await fetchSunflowerFrames(id);
      setFrames(f);
      const last = f[f.length - 1];
      setOnionUrl(last ? photoThumb(last.photo_path, 640) : null);
    } catch {
      setOnionUrl(null);
    }
  };

  // ── 4. Capture + record watering ──────────────────────────────────────────
  const onCapture = async (blob: Blob) => {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const path = await uploadBlob(blob, `frames/${selectedId}`);
      await logWatering({
        spot_id: spotId,
        sunflower_id: selectedId,
        watered_by: gardener || undefined,
        photo_path: path,
      });
      const f = await fetchSunflowerFrames(selectedId);
      setFrames(f);
      router.refresh();
      setStep(selectedSlot && !selectedSlot.name ? "naming" : "done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uložení selhalo");
      setStep("pickSlot");
    } finally {
      setBusy(false);
    }
  };

  // ── 5. Name (if the watered sunflower was unnamed) ────────────────────────
  const submitName = async () => {
    if (!selectedId) return;
    if (!name.trim()) {
      setError("Napiš jméno");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const who = by.trim() || gardener;
      if (who) {
        setGardener(who);
        setG(who);
      }
      const res = await nameSunflowerById({
        sunflower_id: selectedId,
        name: name.trim(),
        message: message.trim() || undefined,
        named_by: who || undefined,
        web_consent: consent,
      });
      if (!res) {
        setError("Tahle slunečnice už má jméno.");
        setBusy(false);
        return;
      }
      router.refresh();
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pojmenování selhalo");
    } finally {
      setBusy(false);
    }
  };

  // ── Slot grid ──────────────────────────────────────────────────────────────
  const Grid = ({ interactive }: { interactive: boolean }) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: 6 }}>
      {slots.map((s) => {
        const free = !s.name;
        const pickable = interactive;
        return (
          <div
            key={s.id}
            className={["slot", free ? "slot-free" : "slot-named", pickable ? "slot-pickable" : "", selectedId === s.id ? "slot-selected" : ""].join(" ")}
            onClick={pickable ? () => pickSunflower(s.id) : undefined}
            title={s.name ?? `Volná slunečnice #${s.index}`}
          >
            {s.name ? s.name : free ? `#${s.index}` : ""}
          </div>
        );
      })}
    </div>
  );

  const Header = ({ title, sub }: { title: string; sub?: string }) => (
    <div style={{ marginBottom: 14 }}>
      <div className="type-md">{title}</div>
      {sub && <p className="type-body" style={{ marginTop: 4, color: "var(--muted)" }}>{sub}</p>}
    </div>
  );

  const ErrorBox = () =>
    error ? (
      <div style={{ border: "3px solid #C0392B", color: "#C0392B", padding: "10px 12px", marginTop: 12, fontWeight: 700, fontSize: 13 }}>
        {error}
      </div>
    ) : null;

  return (
    <div className="card" style={{ padding: 18 }}>
      {step === "panel" && (
        <>
          <Header
            title="Postarej se"
            sub={slots.length > 0 ? `${namedCount} z ${slots.length} pojmenováno. Zalij slunečnici, vyfoť ji a sleduj, jak roste.` : "Zalij tohle místo."}
          />
          {slots.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Grid interactive={false} />
            </div>
          )}
          <button className="btn btn-leaf" style={{ width: "100%" }} onClick={startWatering}>
            {GPS_VERIFY ? "Zalít · ověříme polohu" : "Zalít"}
          </button>
          <p className="type-label" style={{ color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
            {GPS_VERIFY ? `Jen do ${WATERING_RADIUS_M} m · ` : ""}zálivka {POINTS_WATER} bodů, jméno {POINTS_NAME}
          </p>
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
          <div className="anim-locating" style={{ width: 34, height: 34, background: "var(--leaf)", margin: "0 auto 16px" }} />
          <div className="type-md">Ověřuju polohu…</div>
          <p className="type-body" style={{ color: "var(--muted)", marginTop: 6 }}>Drž telefon u slunečnice.</p>
        </div>
      )}

      {step === "tooFar" && (
        <>
          <Header title="Jsi moc daleko" sub={`Jsi asi ${distance} m od místa. Přijď blíž (do ${WATERING_RADIUS_M} m).`} />
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

      {step === "pickSlot" && (
        <>
          <Header title="Kterou zaléváš?" sub="Klepni na slunečnici. Vyfotíš ji a přidáš snímek do jejího filmu." />
          <ErrorBox />
          <div className="anim-slideup"><Grid interactive /></div>
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 14 }} onClick={() => setStep("panel")}>Zrušit</button>
        </>
      )}

      {step === "camera" && (
        <div className="anim-slideup">
          <Header
            title={selectedSlot?.name ? `Vyfoť „${selectedSlot.name}"` : "Vyfoť slunečnici"}
            sub={onionUrl ? "Polož ji přes minulou fotku (onion skin), ať film plyne." : "První snímek jejího filmu."}
          />
          <CameraCapture
            onionUrl={onionUrl}
            onCapture={onCapture}
            onCancel={() => setStep("pickSlot")}
            hint={busy ? "Ukládám snímek…" : undefined}
          />
        </div>
      )}

      {step === "naming" && (
        <div className="anim-slideup">
          <Header title="Pojmenuj slunečnici" sub={`Vyfocenou slunečnici si pojmenuj a získej ${POINTS_NAME} bodů.`} />
          <label className="type-label" style={{ display: "block", margin: "0 0 6px", color: "var(--muted)" }}>Jméno slunečnice</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="např. Boženka" autoFocus />
          <label className="type-label" style={{ display: "block", margin: "14px 0 6px", color: "var(--muted)" }}>Vzkaz (nepovinné)</label>
          <textarea className="field" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Pár slov…" />
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, fontSize: 13, fontWeight: 600 }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            Ukázat moje jméno ({gardener || "tebe"}) veřejně
          </label>
          <ErrorBox />
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep("done")} disabled={busy}>Přeskočit</button>
            <button className="btn btn-sun" style={{ flex: 1.4 }} onClick={submitName} disabled={busy}>{busy ? "Ukládám…" : "Pojmenovat"}</button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div className="anim-pop" style={{ width: 56, height: 56, background: "var(--leaf)", color: "#fff", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900 }}>
            +{POINTS_WATER}
          </div>
          <div className="type-lg" style={{ color: "var(--leaf)" }}>Zaléváno a vyfoceno</div>
          <p className="type-body" style={{ marginTop: 6, marginBottom: 14 }}>
            {selectedSlot?.name ? `„${selectedSlot.name}" má teď ${frames.length} ${frames.length === 1 ? "snímek" : "snímků"} ve filmu.` : `Film má ${frames.length} snímků.`}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {frames.length > 0 && (
              <button className="btn btn-sun" onClick={() => setShowFilm(true)}>Přehrát film</button>
            )}
            <button className="btn btn-ghost" onClick={() => { setStep("panel"); setSelectedId(null); setError(null); }}>Hotovo</button>
          </div>
        </div>
      )}

      {showFilm && (
        <FilmPlayer
          title={selectedSlot?.name ?? "Slunečnice"}
          frames={frames}
          onClose={() => setShowFilm(false)}
        />
      )}
    </div>
  );
}
