"use client";
import { useEffect, useState } from "react";
import {
  getGardener,
  setGardener,
  markOnboarded,
  markCameraOk,
  isOnboarded,
  POINTS_WATER,
  POINTS_NAME,
} from "@/lib/gardener";

type Step = "start" | "name" | "camera";

/**
 * First-run onboarding overlay. Self-gates on localStorage: renders nothing if
 * already onboarded. Steps: intro -> gardener handle -> camera permission.
 */
export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("start");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOnboarded()) {
      setName(getGardener());
      setOpen(true);
    }
    const reopen = () => {
      setName(getGardener());
      setStep("start");
      setError(null);
      setOpen(true);
    };
    window.addEventListener("slunecnice:onboarding", reopen);
    return () => window.removeEventListener("slunecnice:onboarding", reopen);
  }, []);

  if (!open) return null;

  const finish = () => {
    setGardener(name.trim() || "Zahradník");
    markOnboarded();
    setOpen(false);
  };

  const requestCamera = async () => {
    setBusy(true);
    setError(null);
    try {
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }),
        new Promise<MediaStream>((_, rej) => window.setTimeout(() => rej(new Error("timeout")), 15000)),
      ]);
      stream.getTracks().forEach((t) => t.stop());
      markCameraOk();
      finish();
    } catch {
      setError("Kameru povolíš později u slunečnice. Můžeš pokračovat.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "min(460px, 100%)" }} className="anim-slideup">
        {/* progress bars */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {(["start", "name", "camera"] as Step[]).map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 6,
                background: ["start", "name", "camera"].indexOf(step) >= i ? "var(--text)" : "#e2ddc9",
              }}
            />
          ))}
        </div>

        {step === "start" && (
          <div>
            <div className="type-label" style={{ color: "var(--muted)" }}>Kolektivní sázení ve městě</div>
            <h1 className="type-xl" style={{ marginTop: 6 }}>Slunečnice</h1>
            <div className="bar bar-sun" style={{ margin: "18px 0", maxWidth: 100 }} />
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
              {[
                ["1", "Najdi slunečnici na mapě", "Žluté body po celém městě."],
                ["2", "Zalij ji", "Ověříme polohu, musíš být u ní. Za zálivku " + POINTS_WATER + " bodů."],
                ["3", "Vyfoť a pojmenuj", "Z fotek vzniká její film, jak roste. Za jméno " + POINTS_NAME + " bodů."],
              ].map(([n, t, d]) => (
                <li key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span className="type-md" style={{ minWidth: 34, height: 34, border: "3px solid var(--text)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sun)" }}>{n}</span>
                  <div>
                    <div className="type-md" style={{ fontSize: 17 }}>{t}</div>
                    <div className="type-body" style={{ color: "var(--muted)" }}>{d}</div>
                  </div>
                </li>
              ))}
            </ol>
            <button className="btn btn-sun" style={{ width: "100%", marginTop: 24 }} onClick={() => setStep("name")}>
              Začít
            </button>
          </div>
        )}

        {step === "name" && (
          <div>
            <div className="type-label" style={{ color: "var(--muted)" }}>Krok 2</div>
            <h1 className="type-lg" style={{ marginTop: 6 }}>Jak ti říkat?</h1>
            <p className="type-body" style={{ marginTop: 8, marginBottom: 16 }}>
              Tvoje přezdívka v žebříčku zahradníků. Připíše se k zálivkám a jménům.
            </p>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. Tonda"
              autoFocus
              maxLength={24}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep("camera")}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep("start")}>Zpět</button>
              <button className="btn btn-sun" style={{ flex: 1.4 }} onClick={() => name.trim() ? setStep("camera") : setError("Napiš si přezdívku")}>
                Pokračovat
              </button>
            </div>
            {error && <div className="type-label" style={{ color: "#C0392B", marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {step === "camera" && (
          <div>
            <div className="type-label" style={{ color: "var(--muted)" }}>Krok 3</div>
            <h1 className="type-lg" style={{ marginTop: 6 }}>Povol kameru</h1>
            <p className="type-body" style={{ marginTop: 8, marginBottom: 16 }}>
              Když zaléváš, vyfotíš slunečnici. Vidíš její minulou fotku (onion skin)
              a skládáš tak film, jak roste v čase.
            </p>
            {error && (
              <div style={{ border: "3px solid var(--text)", padding: 12, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}
            <button className="btn btn-sun" style={{ width: "100%" }} onClick={requestCamera} disabled={busy}>
              {busy ? "Čekám na povolení…" : "Povolit kameru"}
            </button>
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={finish} disabled={busy}>
              {error ? "Pokračovat na mapu" : "Přeskočit"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
